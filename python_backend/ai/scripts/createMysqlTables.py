import mysql.connector

# Connect to the 'chatbotDatabase' database
con = mysql.connector.connect(
    user='root',
    host='localhost',
    database='chatbotDatabase',
    passwd='9090'
)

cur = con.cursor()

# Create a table named 'UserInputs' with columns to store text inputs and timestamps
cur.execute("""
    CREATE TABLE UserInputs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        input_text VARCHAR(255),
        bot_response VARCHAR(500),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")

# Commit the changes
con.commit()

# Close the cursor and connection
cur.close()
con.close()
