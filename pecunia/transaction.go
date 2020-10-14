package pecunia

import "time"

type Transaction struct {
	Time        time.Time
	Amount      int
	Description string

	Extra string
}
