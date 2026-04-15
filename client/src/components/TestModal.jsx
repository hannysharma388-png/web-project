import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TestModal = ({ test, onClose, onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState((test?.duration || 0) * 60);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch questions for this test. The test object stringified in the payload has questions as IDs or populated.
        // If not populated, we might need a dedicated API to fetch questions for a test.
        // The backend model `Test` has `questions` array. If populated, we use them.
        const fetchQuestions = async () => {
            try {
                if (test.questions && test.questions.length > 0 && typeof test.questions[0] === 'object') {
                    // Questions are already populated objects — use them directly
                    setQuestions(test.questions);
                    setLoading(false);
                } else if (test.questions && test.questions.length > 0 && typeof test.questions[0] === 'string') {
                    // Questions are ID strings — fetch the full test with populated questions
                    const res = await api.get(`/academic/tests?role=test&id=${test._id}`);
                    // Find our test in results or use a direct call
                    const fullTests = res.data;
                    const fullTest = Array.isArray(fullTests) 
                        ? fullTests.find(t => t._id === test._id) 
                        : fullTests;
                    setQuestions(fullTest?.questions || []);
                    setLoading(false);
                } else {
                    // No questions on this test
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to load questions', err);
                toast.error('Failed to load questions.');
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [test]);

    // Timer logic
    useEffect(() => {
        if (isSubmitted || loading || questions.length === 0) return;

        if (timeLeft <= 0) {
            submitTest();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, isSubmitted, loading, questions]);

    const handleAnswerSelection = (qId, option) => {
        setAnswers({
            ...answers,
            [qId]: option
        });
    };

    const submitTest = async () => {
        setIsSubmitted(true);
        // Calculate score
        let calculatedScore = 0;
        const markPerQuestion = test.marks / questions.length || 1;
        questions.forEach(q => {
            if (answers[q._id] === q.correctAnswer) {
                calculatedScore += markPerQuestion;
            }
        });
        setScore(calculatedScore);

        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            await api.post('/academic/test-results', {
                test: test._id,
                student: currentUser.id || currentUser._id,
                score: calculatedScore
            });
            toast.success(`Test completed! You scored ${calculatedScore}/${test.marks}`);
        } catch (err) {
            console.error(err);
            // Score save failed silently — student can still see their score on screen
        }
    };

    const handleClose = () => {
        if (isSubmitted) {
            onComplete();
        } else {
            if (window.confirm("Are you sure you want to exit? Your progress will be lost.")) {
                onClose();
            }
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 border border-x-indigo-50">
                <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center">
                    <h3 className="text-2xl font-bold mb-4">{test.title}</h3>
                    <p className="text-gray-600 mb-6">No questions found for this test.</p>
                    <button onClick={onClose} className="bg-purple-600 text-white px-6 py-2 rounded-xl">Close</button>
                </div>
            </div>
        );
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10 shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{test.title}</h2>
                    <p className="text-sm text-gray-500">{test.subject?.name || 'Subject'}</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className={`text-xl font-mono font-bold flex items-center gap-2 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
                        <i className="fas fa-clock"></i>
                        {formatTime(timeLeft)}
                    </div>
                    {!isSubmitted && (
                        <button onClick={submitTest} className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition font-bold shadow-lg shadow-green-200">
                            Submit Test
                        </button>
                    )}
                    {isSubmitted && (
                        <button onClick={handleClose} className="bg-gray-800 text-white px-6 py-2 rounded-xl hover:bg-gray-900 transition font-bold">
                            Close & Return
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                <div className="max-w-4xl mx-auto space-y-6">
                    {isSubmitted && (
                        <div className="bg-white rounded-2xl p-8 shadow-sm text-center mb-8 border-t-4 border-green-500">
                            <i className="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                            <h3 className="text-3xl font-bold text-gray-800">Test Submitted</h3>
                            <p className="text-xl mt-2 text-gray-600">Your score: <span className="font-bold text-indigo-600">{score.toFixed(1)}</span> out of {test.marks}</p>
                        </div>
                    )}

                    {!isSubmitted ? (
                        questions.map((q, idx) => (
                            <div key={q._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex gap-4">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4">{q.question}</h4>
                                        <div className="space-y-3">
                                            {q.options.map((opt, oIdx) => (
                                                <label key={oIdx} className={`block p-4 border rounded-xl cursor-pointer transition-all ${answers[q._id] === opt ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <input 
                                                            type="radio" 
                                                            name={`question_${q._id}`} 
                                                            value={opt} 
                                                            checked={answers[q._id] === opt}
                                                            onChange={() => handleAnswerSelection(q._id, opt)}
                                                            className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-gray-700">{opt}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        // Results View
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-800">Review Answers</h3>
                            {questions.map((q, idx) => {
                                const isCorrect = answers[q._id] === q.correctAnswer;
                                const notAttempted = !answers[q._id];
                                
                                return (
                                    <div key={q._id} className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${isCorrect ? 'border-l-green-500' : notAttempted ? 'border-l-gray-400' : 'border-l-red-500'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-lg font-semibold text-gray-800"><span className="text-gray-400 mr-2">Q{idx + 1}.</span> {q.question}</h4>
                                            {isCorrect ? (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase"><i className="fas fa-check mr-1"></i> Correct</span>
                                            ) : notAttempted ? (
                                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase"><i className="fas fa-minus mr-1"></i> Skipped</span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase"><i className="fas fa-times mr-1"></i> Incorrect</span>
                                            )}
                                        </div>
                                        
                                        <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                            <div className="text-sm">
                                                <span className="text-gray-500 w-24 inline-block">Your Answer:</span> 
                                                <span className={isCorrect ? 'text-green-700 font-semibold' : 'text-red-600'}>{answers[q._id] || 'Not Answered'}</span>
                                            </div>
                                            {!isCorrect && (
                                                <div className="text-sm">
                                                    <span className="text-gray-500 w-24 inline-block">Correct Ans:</span> 
                                                    <span className="text-green-700 font-semibold">{q.correctAnswer}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TestModal;
