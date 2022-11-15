//                                <----------Project Crickinfo--------->

// Aim -> The purpose of this project is to extract information from web pages and process its data and writing them in excel and pdf files. (Gathering info from web pages and get experienced with js).

// 1. read Data from webpage (crickinfo) -> axios
// 2. process Data fetch all teams as JSON -> jsdom
// 3. write processed data excel sheet-> excel4node 
// 4.create folders one for each team -> fileSystem(fs)
// 5. Establishing path between various files -> path
// 6. write pdf files for score card -> pdf-lib 

// Installing libraries 
// npm init
// npm install minimist 
// npm install axios
// npm install jsdom (if not installed by default).
// npm install excel4node 
// npm install pdf-lib 


// Requiring all node modules
let minimist = require("minimist");
let fs = require("fs");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let path = require("path");
let pdf = require("pdf-lib");
const { error } = require("console");
const workbook = require("excel4node/distribution/lib/workbook");
let args = minimist(process.argv);

// Command to run this file----> node project.js --dest=worldCup  --excelFile=worldCup.csv --url=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results 

// Variables used in Project
let url = args.url;
let dest = args.dest;
let excelFile = args.excel;

// Downloading Data from webPage
let htmlPromise = axios.get(url);//(Promise).
htmlPromise.then(function (response) {
    let html = response.data;

    // Loading html and Preparing DOM(Document Object Model).
    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;


    // Extracting teamNames , resultDivs and Score from DOM
    let matchScoreDiv = document.querySelectorAll("div.match-score-block");
    let matches = [];

    for (let i = 0; i < matchScoreDiv.length; i++) {
        let match = {
            t1: "",
            t2: "",
            t1s: "",
            t2s: "",
            result: ""
        };

        //Team names
        let namePs = matchScoreDiv[i].querySelectorAll("p.name");
        match.t1 = namePs[0].textContent;
        match.t2 = namePs[1].textContent;

        // Team Score
        let scoreSpans = matchScoreDiv[i].querySelectorAll("span.score");
        if (scoreSpans.length == 2) {
            match.t1s = scoreSpans[0].textContent;
            match.t2s = scoreSpans[1].textContent;
        } else if (scoreSpans.length == 1) {
            match.t1s = scoreSpans[0].textContent;
        } else {
            match.t1s = "";
            match.t2s = "";
        }

        // Result
        let resultDivs = matchScoreDiv[i].querySelector("div.status-text > span");
        match.result = resultDivs.textContent;

        matches.push(match);

    }

    // Creating a new Teams Array and Pushing elements in this Array from matches(Array) in desired Format
    let teams = [];
    for (let i = 0; i < matches.length; i++) {
        putTeamsInTeamsArrayifMissing(teams, matches[i]);
    }
    for (let i = 0; i < matches.length; i++) {
        putMatchInAppropriateTeams(teams, matches[i]);
    }


    // Writing teams[] details in excel (excel4node)
    createExcelFiles(teams);


    // Writing  details in pdf files(pdf-lib)
    createTeamFiles(teams);

});

function putTeamsInTeamsArrayifMissing(teams, match) {
    t1indx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (match.t1 == teams[i].name) {
            t1indx = i;
            break;
        }
    }

    if (t1indx == -1) {
        teams.push({
            name: match.t1,
            matches: []
        });
    }


    t2indx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (match.t2 == teams[i].name) {
            t2indx = i;
            break;
        }
    }

    if (t2indx == -1) {
        teams.push({
            name: match.t2,
            matches: []
        });
    }
}


function putMatchInAppropriateTeams(teams, match) {
    t1indx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (match.t1 == teams[i].name) {
            t1indx = i;
            break;
        }
    }

    let team1 = teams[t1indx];
    team1.matches.push({
        vs: match.t2,
        selfScore: match.t1s,
        oppScore: match.t2s,
        Result: match.result
    })


    t2indx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (match.t2 == teams[i].name) {
            t2indx = i;
            break;
        }
    }

    let team2 = teams[t2indx];
    team2.matches.push({
        vs: match.t1,
        selfScore: match.t2s,
        oppScore: match.t1s,
        Result: match.result
    })
}


function createExcelFiles(teams) {
    // Creating workBook in execl
    let wBook = new excel.Workbook();

    // Creating styles for header
    let hstyle = wBook.createStyle({
        font: {
            size: 15,
            bold: true,
            italics: true,
            color: "white"
        },
        fill: {
            type: "pattern",
            patternType: "solid",

        }
    })

    // Adding sheets to this workbook
    for (let i = 0; i < teams.length; i++) {
        let sheet = wBook.addWorksheet(teams[i].name);

        // Feeding matches details in sheet cells

        sheet.cell(1, 1).string("Vs").style(hstyle);
        sheet.cell(1, 2).string("SelfScore").style(hstyle);
        sheet.cell(1, 3).string("OppScore").style(hstyle);
        sheet.cell(1, 4).string("Result").style(hstyle);
        for (let j = 0; j < teams[i].matches.length; j++) {

            let vs = teams[i].matches[j].vs;
            let selfScore = teams[i].matches[j].selfScore;
            let oppScore = teams[i].matches[j].oppScore;
            let Result = teams[i].matches[j].Result;

            sheet.cell(2 + j, 1).string(vs);
            sheet.cell(2 + j, 2).string(selfScore);
            sheet.cell(2 + j, 3).string(oppScore);
            sheet.cell(2 + j, 4).string(Result);

        }
    }

    // Writing workbook in excelFile
    wBook.write("worldCup.csv");
}


function createTeamFiles(teams) {

    fs.mkdirSync(dest);

    for (let i = 0; i < teams.length; i++) {
        // creating sub teams Folder in worldCup
        let teamFolder = path.join(dest, teams[i].name);
        fs.mkdirSync(teamFolder);


        // creating Opponent pdf in teamsFolder
        for (let j = 0; j < teams[i].matches.length; j++) {
            let matchFileName = path.join(teamFolder, teams[i].matches[j].vs + ".pdf");
            // creating Score cards in pdf
            createScoreCards(teams[i].name, teams[i].matches[j], matchFileName);
        }
    }
}


function createScoreCards(teamName, matches, matchFileName) {
    // Here we will use pdf-lib to create the pdf

    let team1 = teamName;
    let team2 = matches.vs;
    let t1score = matches.selfScore;
    let t2score = matches.oppScore;
    let results = matches.Result;

    // pdf Manipulation

    let pDoc = pdf.PDFDocument;
    let originalBytes = fs.readFileSync("scoreCards.pdf");

    let promiseToLoadBytes = pDoc.load(originalBytes);

    promiseToLoadBytes.then(function (pdfDoc) {
        let page = pdfDoc.getPage(0);

        page.drawText(team1, {
            x: 125,
            y: 500,
            size: 15
        });
        page.drawText(team2, {
            x: 215,
            y: 500,
            size: 15
        });
        page.drawText(t1score, {
            x: 320,
            y: 500,
            size: 20
        });
        page.drawText(t2score, {
            x: 400,
            y: 500,
            size: 20
        });
        page.drawText(results, {
            x: 170,
            y: 418,
            size: 15
        });


        let promiseToSave = pdfDoc.save();

        promiseToSave.then(function (newBytes) {
            fs.writeFileSync(matchFileName, newBytes);
        })

    })

}