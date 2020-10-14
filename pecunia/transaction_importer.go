package pecunia

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"sort"
	"strconv"
	"strings"
	"time"
)

// A TransactionImporter loads transaction logs from a file.
type TransactionImporter interface {
	// Name returns a generic name for the importer.
	Name() string

	// Import loads transactions from an importer-specific
	// file format.
	Import(r io.Reader) ([]*Transaction, error)

	// Merge is like Import, but returns the union of
	// transactions from the file, and from an existing
	// list of transactions from the same importer.
	//
	// This allows the importer to prevent duplicates when
	// importing overlapping files.
	Merge(r io.Reader, existing []*Transaction) ([]*Transaction, error)
}

// A WellsFargoImporter imports CSV logs from Wells Fargo.
type WellsFargoImporter struct{}

func (w WellsFargoImporter) Name() string {
	return "Wells Fargo CSV"
}

func (w WellsFargoImporter) Import(r io.Reader) ([]*Transaction, error) {
	cs := csv.NewReader(r)
	records, err := cs.ReadAll()
	if err != nil {
		return nil, err
	}
	tns := make([]*Transaction, 0, len(records))
	for _, record := range records {
		if len(record) != 5 {
			return nil, fmt.Errorf("expected exactly 5 columns")
		}
		parts := strings.Split(record[0], "/")
		if len(parts) != 3 {
			return nil, fmt.Errorf("expected first column to be mm/dd/yyyy but got %s", record[0])
		}
		numParts := make([]int, len(parts))
		for i, x := range parts {
			// Remove leading zeros.
			for len(x) > 0 && x[0] == '0' {
				x = x[1:]
			}
			num, err := strconv.Atoi(x)
			if err != nil {
				return nil, fmt.Errorf("expected first column to be mm/dd/yyyy but got %s", record[0])
			}
			numParts[i] = num
		}
		dollars, err := strconv.ParseFloat(record[1], 64)
		if err != nil {
			return nil, fmt.Errorf("expected money amount but got %s", record[1])
		}
		cents := int(math.Round(dollars * 100))
		jsonData, _ := json.Marshal(record)
		tns = append(tns, &Transaction{
			Time:        time.Date(numParts[0], time.Month(numParts[1]), numParts[2], 12, 0, 0, 0, time.Local),
			Amount:      cents,
			Description: record[4],
			Extra:       string(jsonData),
		})
	}
	return tns, nil
}

func (w WellsFargoImporter) Merge(r io.Reader, existing []*Transaction) ([]*Transaction, error) {
	records, err := w.Import(r)
	if err != nil {
		return nil, err
	}
	contained := map[string]bool{}
	for _, x := range existing {
		contained[x.Extra] = true
	}
	result := append([]*Transaction{}, existing...)
	for _, record := range records {
		if !contained[record.Extra] {
			result = append(result, record)
		}
	}
	sort.SliceStable(result, func(i, j int) bool {
		return result[i].Time.UnixNano() < result[j].Time.UnixNano()
	})
	return result, nil
}
