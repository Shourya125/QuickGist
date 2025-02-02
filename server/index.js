const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const port = 3000;
const SummarizerManager = require("node-summarizer").SummarizerManager;
const { Readability } = require('@mozilla/readability');
const jsdom = require('jsdom');


app.use(express.json());  // Middleware to parse JSON body

// Function to scrape React page with timeout feature
// async function scrapeReactPage(url, timeout = 30000) {
//   try {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();

//     // Start a timeout promise to reject if scraping takes too long
//     const timeoutPromise = new Promise((_, reject) =>
//       setTimeout(() => reject(new Error('Timeout exceeded while scraping')), timeout)
//     );

//     // Navigate to the page and wait for content to load, or hit the timeout
//     const scrapingPromise = (async () => {
//       console.log(`Navigating to URL: ${url}`);
//       await page.goto(url, { waitUntil: 'domcontentloaded' }); // Ensure DOM content is loaded

//       // Wait for <p> tags to be present in the DOM (adjust selector as needed)
//       await page.waitForSelector('p', { timeout: 10000 });  // Wait for a max of 10 seconds for <p> tags

//       // Extract content from <p> tags
//       const paragraphs = await page.evaluate(() => {
//         const pTags = Array.from(document.querySelectorAll('p'));
        
//         return pTags.map(p => p.innerText); // Return text content of all <p> tags
//       });

//       // Log the extracted text content
//       // console.log('Extracted Text from <p> Tags:', paragraphs.join(''));

//       // Close the browser
//       await browser.close();

//       if (paragraphs.length === 0) {
//         return("Sorry, No relevent data to be summarized.");
//       }

//       return paragraphs.join(''); // Return scraped data
//     })();

//     // Use Promise.race to either return the scraping result or timeout
//     const result = await Promise.race([scrapingPromise, timeoutPromise]);

//     return result; // Return the scraped paragraphs

//   } catch (err) {
//     console.error('Error during scraping:', err);
//     return("Sorry, No relevent data to be summarized.");
    
//     // throw err; // Re-throw error to be handled by route handler
//   }
// }

// Summarize text

async function summarizeText(data) {
    try {

        if (!data || data.trim().length < 50) {
          return("Sorry, No relevent data to be summarized.");
        }
        // Initialize SummarizerManager with the text
        const summarizer = new SummarizerManager(data,50);
        console.log("Summarizer created");
        // Await the result of getSummaryByRank() directly
        const summary_object = await summarizer.getSummaryByRank();
        console.log("SUmmarized");
        // console.log(summary_object);
        // Return only the summary part
        return summary_object.summary;
    } catch (err) {
        console.error('Error summarizing text:', err);  
        return("Sorry, No relevent data to be summarized.");
        
        // throw err; // Optionally re-throw the error if you want to handle it later
    }
}

async function extractMainContent(url) {
  // Launch Puppeteer browser instance
  try{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Go to the provided URL
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Get the HTML content of the page
    const html = await page.content();

    // Use jsdom to create a DOM from the HTML content
    const dom = new jsdom.JSDOM(html);
    const document = dom.window.document;

    // Use Readability.js to parse the document and extract main content
    const reader = new Readability(document);
    const article = reader.parse();  // This extracts the main content

    await browser.close();

    // Check if article was successfully extracted and return it
    if (article) {
      return article.textContent;  // Returns the cleaned-up body text
    } else {
      return 'Sorry, no relevant content found.';
    }
  }
  catch(err){
    console.log(err);
  }
}


// POST route to receive the URL and scrape content
app.post('/', async (req, res) => {
  try {
    const { url } = req.body;  // Extract URL from request body

    if (!url) {
      return res.status(400).json({ message: 'No URL provided.' });  // Check if URL is provided
    }

    console.log("Received URL:", url);  // Log the URL to ensure it's being passed correctly

    // Call the scraping function with a timeout of 30 seconds (you can change this)
    console.log("Starting to scrape...");
    // const scrapedData = await scrapeReactPage(url, 30000);  // Timeout after 30 seconds
    // console.log("ssssssss",scrapedData);
    const content = await extractMainContent(url);
    console.log(content);
    console.log("Summarizing data");
    const sumData  = await summarizeText(content);
    console.log("Summarization function ended");
    console.log(sumData);
    console.log("Scraping completed, returning data...");
    res.json({
      message: 'URL received and scraped successfully!',
      receivedUrl: url,
      paragraphs: sumData  // Return scraped paragraphs in the response
    });

  } catch (err) {
    console.error('Error in POST request:', err);
    res.status(500).json({ message: 'Error occurred during scraping.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
