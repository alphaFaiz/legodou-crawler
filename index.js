var express = require("express");
var path = require("path");
let bodyParser = require("body-parser");

const puppeteer = require('puppeteer');
const request = require('request');
const fs = require('fs');

var app = express();

// Configure bodyparser to handle post requests
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
    })
);
app.use(bodyParser.json());
  
app.use(express.static(path.join(__dirname, "public")));
  
app.get('/', (req, res) => {
//download function
    res.sendFile(__dirname+'/view/index.html')
});  

app.post('/api/postLinkToGetImages', async(req, res) => {
    let { inputLink, folderName } = req.body;

    let download = function (uri, filename, callback) {
        let downloadDirectory = `./images/${folderName}`
        try {
            if (!fs.existsSync(downloadDirectory)){
                fs.mkdirSync(downloadDirectory);
            }
            request.head(uri, function (err, res, body) {
                try {
                    if(err) {
                        console.log(`--error:`, filename, uri)
                    }
                    // console.log('content-type:', res.headers['content-type']);
                    // console.log('content-length:', res.headers['content-length']);
                    request(uri).pipe(fs.createWriteStream(`${downloadDirectory}/${filename}`)).on('close', callback);   
                } catch (error) {
                    console.log(`--catch error:`, error);
                }
            });   
        } catch (error) {
            console.log(`--Unexpected up Error:`, error);
        }
    };

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`${inputLink}`);
    const images = await page.evaluate(() => {
        let items = document.querySelectorAll(".entry-content .pict");
        let links = [];
        items.forEach(item => {
            links.push(item.parentElement.getAttribute("href"));
        });
        return links;
    });
    let countdown = images.length;
    images.forEach((image, index) => {
        try {
            download(image, `${index}.jpg`, (error, result) => {
                if (error) {
                    console.log(`--error:`, error);
                } else {
                    console.log(`--success:`, index, image)
                }
                countdown--;
                if(countdown == 0) {
                    console.log('done!!!')
                }
            })    
        } catch (error) {
            console.log(`--Unexpected Error:`, error);
        }
    })
    await browser.close();
    res.json({
        success: true
    })
});

app.listen(PORT=8888, () => {
    console.log(`App is running on ${PORT}`);
});