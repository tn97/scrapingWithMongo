// Dependencies
const express = require('express'),
      cheerio = require('cheerio'),
      rp = require('request-promise'),
      router = express.Router(),
      db = require('../models');

// route to scrape new articles
router.get('/newArticles', (req, res) => {
  //configuring options object for request-promise
  const options = {
    uri: 'https://www.nytimes.com/sections/us',
    transform: (body) => {
      return cheerio.load(body);
    }
  };
  // Calling the database to return all saved articles
  db.Article
  .find({})
  .then((savedArticles) => {
    // creating an array of saved article headlines
    let savedHeadlines = savedArticles.map(article => article.headline);

    // calling request promise with options object
    rp(options)
    .then(($) => {
      let newArticleArr = [];
      // iterating over returned articles, and creating a newArticle object from the data
      $('#latest-panel article.story.theme-summary').each((i, element) => {
        let newArticle = new db.Article({
          storyUrl : $(element).find('.story-body>.story-link').attr('href'),
          headline : $(element).find('h2.headline').text().trim(),
          summary : $(element).find('p.summary').text().trim(),
          imgUrl : $(element).find('p.byline').text().trim()
        });
        // checking to mke sure newArticle contains a storyUrl
        if (newArticle.storyUrl) {
          // checking if new article matches any saved article, if not add it to array of new articles
          if (!savedHeadlines.includes(newArticle.headline)) {
            newArticleArr.push(newArticle);
          }
        }
      }); // end if functions

      // adding all new articles to database
      db.Article
        .create(newArticleArr)
        .then(result => res.json({count: newArticleArr.length}))
        // returning count of new articles to front-end
        .catch(err => {});
    })
    .catch(err => console.log(err));
  })
  .catch(err => console.log(err));
}); // end of get request to /scrape

module.exports = router;