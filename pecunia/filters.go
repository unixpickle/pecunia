package pecunia

import "regexp"

// A Filter is an automated mapping which is applied to
// transactions in an account.
type Filter interface {
	// Filter maps transactions ts to new transactions.
	Filter(ts <-chan *Transaction) <-chan *Transaction
}

// MultiFilter is a Filter that combines many simple
// filters.
type MultiFilter struct {
	PatternFilters []*PatternFilter
	ReplaceFilters []*ReplaceFilter
	SignFilter     *SignFilter
	IDFilter       *IDFilter
}

func (m *MultiFilter) Filter(ts <-chan *Transaction) <-chan *Transaction {
	for _, p := range m.PatternFilters {
		ts = p.Filter(ts)
	}
	for _, r := range m.ReplaceFilters {
		ts = r.Filter(ts)
	}
	if m.SignFilter != nil {
		ts = m.SignFilter.Filter(ts)
	}
	if m.IDFilter != nil {
		ts = m.IDFilter.Filter(ts)
	}
	return ts
}

// ReplaceFilter uses a regular expression to modify the
// descriptions of transactions.
type ReplaceFilter struct {
	Pattern     string
	Replacement string
}

func (r *ReplaceFilter) Filter(ts <-chan *Transaction) <-chan *Transaction {
	patternExpr := regexp.MustCompilePOSIX(r.Pattern)
	res := make(chan *Transaction, 1)
	go func() {
		defer close(res)
		for t := range ts {
			if !patternExpr.MatchString(t.Description) {
				res <- t
				continue
			}
			t1 := new(Transaction)
			*t1 = *t
			t1.Description = patternExpr.ReplaceAllString(t.Description, r.Replacement)
			res <- t1
		}
	}()
	return res
}

// PatternFilter excludes every entry that matches a
// regular expression.
type PatternFilter struct {
	Pattern string
}

func (p *PatternFilter) Filter(ts <-chan *Transaction) <-chan *Transaction {
	patternExpr := regexp.MustCompilePOSIX(p.Pattern)
	res := make(chan *Transaction, 1)
	go func() {
		defer close(res)
		for t := range ts {
			if !patternExpr.MatchString(t.Description) {
				res <- t
			}
		}
	}()
	return res
}

// SignFilter filters for either only positive or only
// negative transactions.
type SignFilter struct {
	Positive bool
}

func (s *SignFilter) Filter(ts <-chan *Transaction) <-chan *Transaction {
	res := make(chan *Transaction, 1)
	go func() {
		defer close(res)
		for t := range ts {
			if s.Positive == (t.Amount >= 0) {
				res <- t
			}
		}
	}()
	return res
}

// IDFilter filters out a set of IDs from the entries.
type IDFilter struct {
	IDs []string
}

func (i *IDFilter) Filter(ts <-chan *Transaction) <-chan *Transaction {
	ids := map[string]bool{}
	for _, id := range i.IDs {
		ids[id] = true
	}
	res := make(chan *Transaction, 1)
	go func() {
		defer close(res)
		for t := range ts {
			if !ids[t.ID] {
				res <- t
			}
		}
	}()
	return res
}
