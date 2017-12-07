"use strict";

/**
 * QuizQuestion object - used to hold the details of a quiz question
 */
function QuizQuestion(question, answers, correctAnswer, questionNumber) {
    this.question = question;               // The quiz question
    this.possibleAnswers = answers;         // The array of possible answers
    this.correctAnswer = correctAnswer;     // The correct answer for the question
    this.questionNumber = questionNumber;   // The question number
    this.userAnswer = null;                 // The answer that the user provided for this question
}

QuizQuestion.prototype.verifyAnswer = function(providedAnswer) {
    return this.correctAnswer === providedAnswer;
};

/**
 * PubQuiz object - used to track and manage the quiz questions
 */
const PubQuiz = {
    quizQuestions: [],              // Array to hold the question for the Pub Quiz
    correctlyAnsweredQuestions: 0,  // Used to track the number of questions answered correctly
    currentQuestionIndex: 0,        // Used to track the current question
    maxQuestions: 10,               // The maximum number of questions to ask in the Quiz
    initQuizQuestions: function(callback_fn) {
        // - Should reset all the counters and question array
        // - Should load all available questions from the JSON file
        // - Randomly select 10 questions and place them into the quizQuestions array
        // - After successfully loading the questions from the JSON data, run the callback function

        this.correctlyAnsweredQuestions = 0;
        this.currentQuestionIndex = 0;
        this.quizQuestions = [];

        $.getJSON('assets/js/quiz-questions.json')
            .done((questionData) => {
                // Shuffle the whole array using underscore.js _.shuffle() method and then get the first 10 elements (i.e. questions)
                this.quizQuestions = _.shuffle(questionData).slice(0, this.maxQuestions).map((questionItem, questionNumber) => {
                    return new QuizQuestion(questionItem.question, _.shuffle(questionItem.possibleAnswers), questionItem.correctAnswer, ++questionNumber);
                });
                callback_fn();
            })
            .fail(() => {
                alert('Sorry, I can\'t load the questions. Cannot continue with the quiz :(');
            });
    },
    currentQuestion: function() {
        // Should return the current question, i.e. the current QuizQuestion object in the array given by the currentQuestionIndex
        return this.quizQuestions[this.currentQuestionIndex];
    },
    nextQuestion: function() {
        // Should return the next question in line, i.e. the next QuizQuestion object in the array given by the currentQuestionIndex
        // Should increment the currentQuestionIndex by 1
        if ((this.currentQuestionIndex + 1) < this.maxQuestions) {
            return this.quizQuestions[++this.currentQuestionIndex];
        } else {
            return null;
        }
    },
    forEachQuestion: function (callback_fn) {
        this.quizQuestions.forEach(callback_fn);
    }
};

/**
 * PubQuizView object - used to manipulate the DOM to show the various quiz pages, questions and feedback
 */
const PubQuizView = {
    startQuiz: function () {
        // - Should tell PubQuiz to init the questions
        // - Should get the first question from PubQuiz
        // - Should hide the start page
        // - Should show the question page and fill in the question and answers
        PubQuiz.initQuizQuestions(() => {
            // hide the start page and feedback page and show the quiz question page
            $('.page-start').addClass('hidden');
            $('.page-feedback').addClass('hidden');
            $('.page-quiz').removeClass('hidden');

            // Display the first question
            this.displayQuizQuestion(PubQuiz.currentQuestion());
        });
    },
    displayQuestionNumber: function (questionNumber) {
        $('.question-number').text(`Question: ${questionNumber}/${PubQuiz.maxQuestions}`);
    },
    displayCurrentScore: function (score) {
        $('.track-score').text(`${score}/${PubQuiz.maxQuestions} Correctly Answered Questions`);
    },
    displayQuizQuestion: function (quizQuestion) {
        // Reset the alert message text, in case there is one
        $('.alert-message').text('');

        // Show the quiz question
        $('.quiz-question').text(quizQuestion.question);

        // Update each of the 4 radio input fields with one of the 4 possible answers, and remove any user feedback from previous question
        $.each($('.js-quiz-answer'), (index, element) => {
            $(element).val(quizQuestion.possibleAnswers[index]);
            $(element).next('span').text(quizQuestion.possibleAnswers[index]);
            //$(element).prop('checked', false); // Make sure it's not checked
            $(element).prop('checked', false).closest('label').removeClass('color-green color-red').find('i').removeClass('fa-check fa-times');
        });

        // Show the current question number
        this.displayQuestionNumber(quizQuestion.questionNumber);

        // Show the total number of correct questions answered
        this.displayCurrentScore(PubQuiz.correctlyAnsweredQuestions);
    },
    checkAnswer: function() {
        // Reset the alert message text
        let alertMessageContainer = $('.alert-message');
        alertMessageContainer.removeClass('color-green color-red').text('');

        // Check if the user clicked on a radio button
        if (!$('input[type=radio]').is(':checked')) {
            alertMessageContainer.addClass('color-red').text('Please select an answer and then click the "Check Your Answer" button');
            return false;
        }

        // Record what the user submitted as the answer to the current question
        let selectedInput = $('input[type=radio]:checked');
        PubQuiz.currentQuestion().userAnswer = selectedInput.val();

        // Check if the selected answer is correct or not, increment the PubQuiz.correctlyAnsweredQuestions and provide user feedback
        if (PubQuiz.currentQuestion().verifyAnswer(selectedInput.val())) {
            PubQuiz.correctlyAnsweredQuestions++;
            this.displayCurrentScore(PubQuiz.correctlyAnsweredQuestions);
            alertMessageContainer
                .addClass('color-green')
                .html('<i class="fa fa-check"></i> YAY! That\'s correct!');
        } else {
            alertMessageContainer
                .addClass('color-red')
                .html(`<i class="fa fa-times"></i> Sorry, that's wrong! The correct answer is: ${PubQuiz.currentQuestion().correctAnswer}`);
        }
        this.highlightCorrectAnswer(PubQuiz.currentQuestion().correctAnswer, selectedInput);
        return true;
    },
    highlightCorrectAnswer: function (correctAnswer, userInputElement) {
        if ($(userInputElement).val() === correctAnswer) {
            $(userInputElement).closest('label').addClass('color-green').find('i').addClass('fa-check');
        } else {
            $.each($('.js-quiz-answer'), (index, element) => {
                if ($(element).val() === correctAnswer) {
                    $(element).closest('label').addClass('color-green').find('i').addClass('fa-check');
                }
                if ($(element).val() === $(userInputElement).val()) {
                    $(element).closest('label').addClass('color-red').find('i').addClass('fa-times');
                }
            });
        }
    },
    displayQuizSummary: function () {
        // Hide the quiz page and show the feedback page
        $('.page-quiz').addClass('hidden');
        $('.page-feedback').removeClass('hidden');

        // Show the total number of questions answered correctly
        $('.js-feedback-total-questions-correct').text(`${PubQuiz.correctlyAnsweredQuestions}/${PubQuiz.maxQuestions}`);

        // Show the feedback message depending on the number of correctly answered questions. If 70% correct, they are a master
        $('.pub-quiz-master').addClass('hidden');
        $('.pub-quiz-apprentice').addClass('hidden');
        let feedbackClass = PubQuiz.correctlyAnsweredQuestions / PubQuiz.maxQuestions >= 0.7 ? '.pub-quiz-master' : '.pub-quiz-apprentice';
        $(feedbackClass).removeClass('hidden');

        // Empty the existing feedback section
        $('.questions-feedback').empty();

        // Show each question and display what the correct answer was and what the user picked and if that was the correct pick
        PubQuiz.forEachQuestion(function (quizQuestion) {
            let questionItemBox = $.parseHTML(`<div class="feedback-box">
                                                  <i class="fa"></i>
                                                  <p>Q: <span class="js-question">${quizQuestion.question}</span></p>
                                                  <p>Your answer: <span class="js-user-answer">${quizQuestion.userAnswer}</span></p>
                                                  <p>Correct answer: <span class="js-correct-answer">${quizQuestion.correctAnswer}</span></p>
                                              </div>`);

            if (quizQuestion.correctAnswer === quizQuestion.userAnswer) {
                $(questionItemBox)
                    .addClass('color-green')
                    .find('.fa').addClass('fa-check');
            } else {
                $(questionItemBox)
                    .addClass('color-red')
                    .find('.fa').addClass('fa-times');
            }

            $('.questions-feedback').append(questionItemBox);
        });

    }
};

function handleQuizEvents() {
    // Start quiz form event handler
    $('#form-start-quiz').on('submit', function (event) {
        event.preventDefault();

        // Clicking the submit button:
        // - Should initialize the quiz questions
        // - Should hide the landing page section and show the quiz section
        // - Should render the first quiz question
        PubQuizView.startQuiz();
    });

    // Submit answer form event handler
    $('#form-pub-quiz').on('submit', function (event) {
        event.preventDefault();

        // Clicking the submit button should
        // - Check if the button text is 'Check Answer', if it is
        //   - validate the answer
        //   - provide feedback to the user
        //   - change the 'submit' button text to 'Next Question'
        let buttonText = $(this).find('button').text();
        if (buttonText === 'Check Your Answer' && PubQuizView.checkAnswer()) {
            $(this).find('button').text('Next');
        }
        // - if the button text is 'Next', it should
        //   - Change the text back to Check Answer
        //   - Get the next question from PubQuiz
        //   - Tell PubQuizView to render the next question
        if (buttonText === 'Next') {
            $(this).find('button').text('Check Your Answer');
            let nextQuestion = PubQuiz.nextQuestion();
            if (nextQuestion !== null) {
                PubQuizView.displayQuizQuestion(nextQuestion);
            } else { // We're at the last question, show the summary page
                PubQuizView.displayQuizSummary();
            }
        }
    });

    $('#form-retry-quiz').on('submit', function (event) {
        event.preventDefault();
        // Clicking the submit button:
        // - Should initialize the quiz questions
        // - Should hide the feedback page section and show the quiz section
        // - Should render the first quiz question
        PubQuizView.startQuiz();
    });

}

// Document ready call to handleQuizEvents function to handle all the questions
$(handleQuizEvents);
