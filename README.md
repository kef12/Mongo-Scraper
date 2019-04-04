# Mongo-Scraper

The Mongo-Scraper application uses Cheerio to scrape articles from the New York Times Science website and a displays the articles using Handlebars. It then uses MongoDB to store the articles that users have saved--users can also add notes to their saved articles if they choose.

Functionality:
1. User will first click on the "Scrape Articles" button in the top right corner. 
2. The application will scrape the NYT science website and return the Headline, Summary, and URL for each article.
3. The user can then save or make notes on any article they choose.

Technologies Used:
* Cheerio
* Axios
* Mongoose
* Express
* Express-Handlebars

