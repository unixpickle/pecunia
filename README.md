# pecunia

**pecunia** is a small locally-hosted web application for tracking your spending. The main goal is to help you categorize your purchasing to track what fraction of your money is going to which categories.

The intended usage flows as follows:

 * Create "Accounts" for each source of transactions that affect your finances (each bank account, credit card, etc.).
 * Upload transaction data for each account (currently, only Wells Fargo's CSV format is supported).
 * Assign transactions to categories by creating filters, which match transaction descriptions using POSIX regular expressions.
 * Look at your account summary to see a breakdown of your spending, as well as a sorted list of uncategorized transactions to help you categorize more items.
 * Frequently re-upload your latest transaction data. This data is automatically merged and categorized.
