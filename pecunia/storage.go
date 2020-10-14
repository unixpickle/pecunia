package pecunia

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/google/uuid"
)

// An Account is a collection of transactions which have
// been imported from a specific source.
type Account struct {
	ID         string
	Name       string
	ImporterID string
}

// Storage provides a system for saving transactions under
// accounts, updating these accounts, etc.
type Storage interface {
	Accounts() ([]*Account, error)
	AddAccount(name, importerID string) (*Account, error)
	Transactions(accountID string) ([]*Transaction, error)

	// SetTransactions updates the transaction table under
	// an account. This may be used to add, delete, and
	// update transactions.
	//
	// Note that the IDs of the incoming transactions are
	// important. If IDs are empty, then the transaction
	// is assumed to be added rather than modified, and a
	// new ID is generated and set on the transaction.
	SetTransactions(accountID string, trans []*Transaction) error

	DeleteAccount(accountID string) error
}

// DirStorage is a storage system that using a directory
// on the file system.
type DirStorage struct {
	Dir string

	lock sync.RWMutex
}

func (d *DirStorage) Accounts() ([]*Account, error) {
	d.lock.RLock()
	defer d.lock.RUnlock()

	listing, err := ioutil.ReadDir(d.Dir)
	if err != nil {
		return nil, err
	}
	var accts []*Account
	for _, item := range listing {
		if strings.HasPrefix(item.Name(), "account_") && !strings.HasSuffix(item.Name(), ".tmp") {
			var acct Account
			if err := d.readFile(item.Name(), &acct); err != nil {
				return accts, err
			}
			accts = append(accts, &acct)
		}
	}
	return accts, nil
}

func (d *DirStorage) AddAccount(name, importerID string) (*Account, error) {
	d.lock.Lock()
	defer d.lock.Unlock()

	accountID := uuid.New().String()
	account := &Account{
		ID:         accountID,
		Name:       name,
		ImporterID: importerID,
	}
	accountFile := fmt.Sprintf("account_%s.json", accountID)
	if err := d.writeFile(accountFile, account); err != nil {
		return nil, err
	}
	return account, nil
}

func (d *DirStorage) Transactions(accountID string) ([]*Transaction, error) {
	d.lock.RLock()
	defer d.lock.RUnlock()

	name := fmt.Sprintf("transactions_%s.json", accountID)
	var transactions []*Transaction
	if err := d.readFile(name, &transactions); err != nil {
		if os.IsNotExist(err) {
			return []*Transaction{}, nil
		}
		return nil, err
	}
	return transactions, nil
}

func (d *DirStorage) SetTransactions(accountID string, ts []*Transaction) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	for _, t := range ts {
		if t.ID == "" {
			t.ID = uuid.New().String()
		}
	}
	name := fmt.Sprintf("transactions_%s.json", accountID)
	return d.writeFile(name, ts)
}

func (d *DirStorage) DeleteAccount(accountID string) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	transactionsFile := fmt.Sprintf("transactions_%s.json", accountID)
	accountFile := fmt.Sprintf("account_%s.json", accountID)

	if err := os.Remove(accountFile); err != nil {
		return err
	}

	// Ignore error since the account is already gone and
	// the transactions will never be found/used on their own
	// so will leak storage but not cause any breakages.
	os.Remove(transactionsFile)

	return nil
}

func (d *DirStorage) readFile(name string, out interface{}) error {
	r, err := os.Open(filepath.Join(d.Dir, name))
	if err != nil {
		return err
	}
	defer r.Close()
	return json.NewDecoder(r).Decode(out)
}

func (d *DirStorage) writeFile(name string, obj interface{}) error {
	tmpPath := filepath.Join(d.Dir, name+".tmp")
	w, err := os.Create(tmpPath)
	if err != nil {
		return err
	}
	err = json.NewEncoder(w).Encode(obj)
	w.Close()
	if err != nil {
		os.Remove(tmpPath)
		return err
	}
	return os.Rename(tmpPath, filepath.Join(d.Dir, name))
}
