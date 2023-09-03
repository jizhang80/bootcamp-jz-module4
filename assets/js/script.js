// import quiz object from json file in ./assets/js/quiz.json
import quiz from './quiz.json' assert { type: 'json' };
/*
quiz object structure, store all the quiz
{
        "index": 1,
        "question": "Inside which HTML element do we put the JavaScript?",
        "choices": [
            "1. <js>", 
            "2. <scripting>", 
            "3. <javascript>", 
            "4. <script>"
        ],
        "answer": 4
    }
*/

/* define scores object */
function Scores(initial, score) {
    this.initial = initial;
    this.score = score;
}

/* constant variable define */
const TIMETOTAL = 60; // total time
const SCORE = 20;  // win score per quiz
const PUNISH = 10; // punish time seconds if wrong
const STORAGEKEY = "quizScoresList"; //localstorage key

// all the pages and areas define
const topArea = document.querySelector('#top'); // viewscore and timer area
const firstPage = document.querySelector('#first-page'); 
const quizPage = document.querySelector('#quiz-page'); 
const donePage = document.querySelector('#done-page');
const scoresPage = document.querySelector('#scores-page');
const bottomDiv = document.querySelector('#bottom'); // the area for the result, correct/wrong
// the global element define
const startQuizBtn = document.querySelector("#start-quiz-btn");
const timerSpan = document.querySelector('#time');
const finalScore = document.querySelector('#final-score');
const initName = document.querySelector('#init-name');
const viewHighScoresBtn = document.querySelector('#viewscore-btn');

//bind handler for viewHighScoresBtn
viewHighScoresBtn.addEventListener('click', handleViewHighScores);

// quiz status
quiz.currentScore = 0; // current quiz user scores
quiz.idx = 0; // quiz obj arr idx
quiz.time = TIMETOTAL;
quiz.scores = []; // Scores(initial, score) object array
quiz.timerId = 0; // setInterval returned id, number, if there is a setInterval, then non-zero number

/* define quiz object functions */
// reset quiz to re-start status
quiz.reset = function() {
    this.idx = 0;
    this.currentScore = 0;
    this.time = TIMETOTAL;
    this.clearTimer();
    // do not reset scores list here
}

// insert newScoresObj into quiz.scores arr to have a descending order of score
quiz.insertScoresList = function(newScoresObj) {
    if (quiz.scores.length > 0) {
        for (let i = 0; i < quiz.scores.length; i++) {
            if (newScoresObj.score > quiz.scores[i].score) {
                quiz.scores.splice(i, 0, newScoresObj);
                return;
            }
        }
    } 
    quiz.scores.push(newScoresObj);
}

// save new scores object action, insert into scores arr, then save localStorage.
quiz.setScoresList = function(newScoresObj) {
    // insert data
    this.insertScoresList(newScoresObj)
    // save to localstorage
    localStorage.setItem(STORAGEKEY, JSON.stringify(quiz.scores));
}

// from local storage get the scorelist arr
quiz.getScoresList = function() {
    // return scores object list, if no such key, return null
    const storeList = JSON.parse(localStorage.getItem(STORAGEKEY));
    return ((storeList === null)? [] : storeList)
}

//clear score list local storage and arr
quiz.clearScoresList = function() {
    localStorage.removeItem(STORAGEKEY);
    quiz.scores = [];
}

// build each quiz page from quiz object arr
quiz.buildPage = function() {
    //build quiz page by current quiz.idx
    const q = this[this.idx]; // idx should be 0, the first quiz
    const qTitle = document.querySelector('#quiz-title');
    const choicesZone = document.querySelector('#choices-zone');
    choicesZone.textContent = ''; // empty first
    qTitle.textContent = q.question;
    for (let c of q.choices) {
        const btn = document.createElement('button');
        btn.className = "global-btn question-choices";
        // take the first char in choices str as choice dataset, but if answer string format change, will be terrible, any algorithm chould be better?
        btn.dataset.id = c[0]; 
        btn.textContent = c;
        choicesZone.append(btn);
    }
}

// get current quiz, not as useful as I think
quiz.currentQuiz = function() {
    return this[this.idx];
}

// get next quiz, then build it on page
quiz.nextQuiz = function() {
    this.idx++;
    if (this.idx === quiz.length) {
        return 'done'; // all quiz done
    }
    this.buildPage();
    return this.idx;
}

// wrong answer punish
quiz.punish = function(punishTime) {
    quiz.time -= punishTime;
}

// right answer sweeteeeeee
quiz.addScore = function(score) {
    quiz.currentScore += score;
}

// setInterval for timer
quiz.setTimer = function() {
    this.timerId = setInterval(()=>{
        timerSpan.textContent = this.time--;
        if (this.time < 0) {
            this.clearTimer();
            showDonePage();
            timerSpan.textContent = "0";
        }
    }, 1000);
}

// clearInterval for timer
quiz.clearTimer = function() {
    clearInterval(this.timerId);
    this.timerId = 0;
}
/* end for quiz object functions */


/* 


application start here 


*/
function init() {
    // application start
    // show first page
    showFirstPage();
    // load data
    quiz.scores = quiz.getScoresList();
}

init();

/* first page display and btn action define */
function showFirstPage() {
    // show topArea and first page
    topArea.style.display = 'flex';
    firstPage.style.display = 'inline';
    // hide pages
    quizPage.style.display = 'none';
    donePage.style.display = 'none';
    scoresPage.style.display = 'none';
    // bind start quiz btn with handler
    startQuizBtn.addEventListener('click', handleStartQuiz);
    // setup timer
    timerSpan.textContent = quiz.time;
}

function handleStartQuiz() {
    // show quizPage, start timer
    quiz.setTimer();
    showQuizPage();
    // build quiz content
    quiz.buildPage();
}
/* end frist page*/

/* quiz page and btn define */
function showQuizPage() {
    // show topArea and quiz page
    topArea.style.display = 'flex';
    quizPage.style.display = 'block';
    // hide pages
    firstPage.style.display = 'none';
    donePage.style.display = 'none';
    scoresPage.style.display = 'none';
    // bind handler for quizPage
    const choicesZone = document.querySelector('#choices-zone');
    choicesZone.addEventListener('click', handleChoose);
}

function handleChoose(event) {
    // choose an answer, display result for seconds, display next quiz
    const choice = event.target.dataset.id;
    const answer = quiz.currentQuiz().answer;
    showResult(choice === answer);
    // if all quiz done, display done page
    if (quiz.nextQuiz() === 'done') {
        quiz.clearTimer();
        showDonePage();
    }
}

function showResult(result) {
    let displayStr = '';
    if (result) {
        // correct, add score, set display str "Correct!"
        displayStr = "Correct!"
        quiz.addScore(SCORE);
    } else {
        // wrong, punish time, set display str "Wrong!"
        displayStr = "Wrong!"
        quiz.punish(PUNISH);
    }
    // show result
    const resultEl = document.querySelector('#result');
    resultEl.textContent = displayStr;
    bottomDiv.style.display = 'block'; // show the result information
    // display result 1 seconds
    setTimeout(()=>{bottomDiv.style.display = 'none';}, 1000);
}
/* end for quiz page */

/* All done page define */
function showDonePage() {
    // show topArea and done page
    topArea.style.display = 'flex';
    donePage.style.display = "block";
    // hide pages
    firstPage.style.display = 'none';
    quizPage.style.display = "none";
    scoresPage.style.display = 'none';
    // show final score
    finalScore.textContent = quiz.currentScore;
    initName.value = '';
    // bind handler to submit btn
    const submitBtn = document.querySelector('#submit-score-list');
    submitBtn.addEventListener('click', handlesubmitInitials);
}

function handlesubmitInitials(event) {
    event.preventDefault();
    // submit initials, display scores page
    if (initName.value !== '') {
        const newScores = new Scores(initName.value, quiz.currentScore);
        quiz.setScoresList(newScores)
    }
    showScoresPage();
}
/* end for all done page */

/* show scores list page */
function showScoresPage() {
    // show score page ONLY
    scoresPage.style.display = 'block';
    // hide pages
    topArea.style.display = 'none';
    donePage.style.display = "none";
    firstPage.style.display = 'none';
    quizPage.style.display = "none";
    buildScoresList();
    // bind handler to go back btn
    const goBackBtn = document.querySelector('#go-back');
    goBackBtn.addEventListener('click', handleGoBack);
    // bind handler to clear high score btn
    const clearHighScoreBtn = document.querySelector('#clear-high');
    clearHighScoreBtn.addEventListener('click', handleClearHighScores);
}

function buildScoresList() {
    // display list on page
    const scoresListEl = document.querySelector('#scores-list');
    scoresListEl.textContent = ''
    const scoresList = quiz.getScoresList();
    if (scoresList !== null) {
        for (let scoreObj of scoresList) {
            const liEl = document.createElement('li');
            liEl.className = "score-list-item";
            liEl.textContent = `${scoreObj.initial} - ${scoreObj.score}`;
            scoresListEl.append(liEl);
        }
    } else {
        scoresListEl.textContent = 'No record';
    }
}

function handleGoBack() {
    // go back btn to start page
    quiz.reset();
    showFirstPage();
}

function handleClearHighScores() {
    // clear localstorage records
    if (confirm("Are you sure clear all the records?")) {
        quiz.clearScoresList();
        // clear display scores list
        const scoresList = document.querySelector("#scores-list");
        scoresList.textContent = 'No record!';
    }
}
/* end for show socres list page */

/* view high scores link */
function handleViewHighScores() {
    if (quiz.timerId !== 0) {
        // quiz.timerId !== 0 means quiz ongoing
        if (confirm("Are you sure leave current page?")) {
            quiz.clearTimer();
        } else {
            return; // answer cancel, do nothing
        }
    }
    showScoresPage();
}
