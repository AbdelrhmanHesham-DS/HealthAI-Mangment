import mysql.connector

# Connect to the 'chatbotDatabase' database
try:
    con = mysql.connector.connect(
        user='root',
        host='localhost',
        database='chatbotDatabase',
        passwd='9090'
    )
    print("Connected to database successfully")
except mysql.connector.Error as err:
    print(f"Error: {err}")
    exit(1)

cur = con.cursor()

# Retrieve all records from the 'UserInputs' table
cur.execute("SELECT * FROM UserInputs")
rows = cur.fetchall()

# Check if any rows are returned
if rows:
    # Print each row
    for row in rows:
        print(f"ID: {row[0]}, Input Text: {row[1]}, 'bot_response': {row[2]} , Timestamp: {row[3]}")
else:
    print("No records found in the table.")

# Close the cursor and connection
cur.close()
con.close()
