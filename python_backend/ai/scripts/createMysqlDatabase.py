

import mysql.connector 
 
# Connect to MySQL server (not to a specific database)
con = mysql.connector.connect(
    user='root',
    host='localhost',
    passwd='9090'
) 

cur = con.cursor() 

# Create a new database named 'chatbotDatabase'
cur.execute("CREATE DATABASE chatbotDatabase") 

# Commit the changes
con.commit() 

# Close the cursor and connection
cur.close() 
con.close()  

