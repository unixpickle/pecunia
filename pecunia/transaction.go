package pecunia

import "time"

type Transaction struct {
	Time        time.Time
	Amount      int
	Description string

	// Set by an importer.
	Extra string

	// Set by the data store.
	ID string
}
