export default `# ACSV (Auto Comma-Separated Values) - Syntax Tutorial
# ACSV is a superset of CSV that allows automatic cell population using simple operators.
# Any valid CSV is also valid ACSV, but ACSV needs to be transpiled to CSV before use.

# ============================================================================
# BASICS
# ============================================================================
# Lines starting with > are ACSV control lines (new explicit syntax!)
# Lines starting with # are comments and will be removed from the output

# Basic example - header row followed by data rows
id,name,status
1,Alice,active
2,Bob,inactive
3,Charlie,active

# ============================================================================
# BASIC OPERATORS
# ============================================================================
# col_name=value - Assign a static value to a column for all following rows

product,price,category
> price=19.99,category=Electronics
iPhone,,
Laptop,,

# ============================================================================
# ONE-SHOT INCREMENT/DECREMENT OPERATORS
# ============================================================================
# col_name+ - Increment by 1 once (one-shot, not per-row)
# col_name- - Decrement by 1 once (one-shot, not per-row)

session,count
> count=100
Event 1,,
> count+
Event 2,,
> count+
Event 3,,

# ============================================================================
# ACCUMULATING OPERATORS
# ============================================================================
# col_name++ - Increment by 1 for each following row (accumulating per-row)
# col_name-- - Decrement by 1 for each following row (accumulating per-row)

id,name,score
> id++,name=Player A,score=100
,,
,,
,,

# ============================================================================
# STOP OPERATOR
# ============================================================================
# col_name++STOP - Stop the accumulation of col_name++
# After STOP, the column value remains at the last emitted value

order_id,status
> order_id++
Order 1,,
> order_id++STOP
Order 2,,
Order 3,,

# ============================================================================
# STEP VALUES
# ============================================================================
# col_name++N - Increment by N for each row (e.g., id++2 increments by 2)
# Works with accumulating operators

id,value
> id++2,value=100
,,
,,
,,

# ============================================================================
# DATE INCREMENTS
# ============================================================================
# Dates in YYYY-MM-DD format automatically increment day by day
# Works seamlessly with step values for skipping days

id,date,event
> id++,date=2025-01-01,event=Meeting
,,
,,
,,

# Example with step values - increments date every 2 days
id,date,event
> id++2,date=2025-01-01,event=Meeting
,,
,,
,,

# ============================================================================
# RANGE OPERATOR
# ============================================================================
# col_name=start..end - Generate a sequence from start to end

id,task
> id=1..5,task=Task
,,
,,
,,

# ============================================================================
# ROW REPEAT OPERATOR
# ============================================================================
# xN - Repeat a control line's effect N times, generating N data rows

id,name,role
> id++,name=Alice,role=Developer x3
,,

# ============================================================================
# EXPRESSIONS
# ============================================================================
# You can use mathematical expressions that reference other columns
# Supported operations: +, -, *, /, parentheses for grouping

price,qty,total,discount,final_total
> price=10,qty=5,total=price*qty,discount=total*0.1,final_total=total - discount
,,

price=20,qty=3,total=price*qty,discount=total*0.15,final_total=total - discount
,,

# ============================================================================
# prev() HELPER
# ============================================================================
# prev(column_name) - Reference the value of a column from the previous row
# Useful for calculating differences, running totals, etc.

value,diff,running_total
> value=10,diff=,running_total=value
,,
value=15,diff=value - prev(value),running_total=prev(running_total) + value
,,
value=20,diff=value - prev(value),running_total=prev(running_total) + value
,,

# ============================================================================
# COMBINING FEATURES - COMPLEX EXAMPLE
# ============================================================================
# Here's a more realistic example combining multiple features

order_id,customer,order_date,item_price,quantity,subtotal,tax,total
> order_id++,customer=Alice,order_date=2025-01-01,item_price=19.99,quantity=2,subtotal=item_price*quantity,tax=subtotal*0.08,total=subtotal + tax
,,
,

> order_id++
> customer=Bob
> item_price=29.99,quantity=1,subtotal=item_price*quantity,tax=subtotal*0.08,total=subtotal + tax
,,
,,

# ============================================================================
# ADDITIONAL NOTES
# ============================================================================
# - Control lines are prefixed with > and can have any order of column instructions
# - Column names are matched by name, not position
# - Blank rows (,,) generate data rows with accumulated values
# - Multiple blank rows generate multiple data rows
# - Control lines apply to all following rows until a new control line changes them
# - Expression evaluation happens per row, so column references are current row values
# - prev() accesses the previous row's value for the same column

`