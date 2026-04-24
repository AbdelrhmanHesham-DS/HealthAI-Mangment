from flask import Flask, request, jsonify, render_template
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from textblob import TextBlob
import mysql.connector
import torch
import numpy as np
import re
import pickle
 
app = Flask(__name__)


db_config = {
    'user': 'root',
    'host': 'localhost',
    'passwd':'1234',
    'database':'chatbotDatabase' 
}


output_dir = 'trainedModel'
sentenceModel = SentenceTransformer(output_dir)

with open('pickleFiles/faq_embeddings.pkl', 'rb') as f:
    faq_embeddings = pickle.load(f)

with open('pickleFiles/responseDF.pkl', 'rb') as f:
    responseDF = pickle.load(f)


# Clean the text by removing unwanted characters
def queryCleanText(text):
    text = re.sub(r'\r\n', ' ', text)  # Remove carriage returns and line breaks
    text = re.sub(r'\s+', ' ', text)  # Remove extra spaces
    text = re.sub(r'<.*?>', '', text)  # Remove any XML tags
    text = re.sub(r'\d+','',text)
    text = text.strip().lower()  # Strip and convert to lowercase
    return text



def classify_sentiment(text):
    blob = TextBlob(text)
    sentiment = blob.sentiment.polarity
    if sentiment > 0:
        return "Positive"
    elif sentiment < 0:
        return "Negative"
    else:
        return "Neutral"



def chatbot(dialogue):
    new_query = queryCleanText(dialogue) 
    new_query_embedding = sentenceModel.encode([new_query]) 
    similarities = cosine_similarity(new_query_embedding, faq_embeddings)
    most_similar_query_index = np.argmax(similarities)
    best_score = similarities[0][most_similar_query_index].item() 

    sentiment = classify_sentiment(new_query) 
    
    if sentiment == "Negative":
        return "Please drop us a mail regarding your concerns."
    elif best_score >= 0.70: 
    # Retrieve the most similar query and its response 
        response = responseDF[most_similar_query_index] 
        return response 
    elif best_score >= 0.60:
        return "Sorry we are facing some technical difficulties , please write to us on contact@healthcarerocks.com"
    elif best_score >= 0.40:
        return "Please write to us on our mail ID contact@healthcarerocks.com"
    else:
        return "please write a mail regarding any queries related to our services"


# Rendering Index root
@app.route("/")
def index():
    return render_template("home.html")

# API endpoint
@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message", "")
    if not user_message:
        return jsonify({"error": "Message is required"}), 400
    response = chatbot(user_message)
    
    con = mysql.connector.connect(**db_config)
    cur = con.cursor()

    query = "INSERT INTO UserInputs (input_text , bot_response) VALUES (%s,%s)"
    cur.execute(query,(user_message,response))
    con.commit()

    cur.close()
    con.close() 

    return jsonify({"response": response})
   

if __name__ == "__main__":
    app.run(debug=True)



