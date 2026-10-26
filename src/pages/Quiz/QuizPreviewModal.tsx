import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import PopupModal from '../../components/PopupModal/PopupModal';
import NoDataFound from '../../components/NoDataFound/NoDataFound';
import superSalesAPI from '../../services/LearningAPI';
import { QUESTION_OPTION_KEYS, type QuizQuestion, type QuizRecord } from './Constant';

interface QuizPreviewModalProps {
    quiz: QuizRecord | null;
    onClose: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// Read-only view of every question of a quiz, laid out the way a student sees it
const QuizPreviewModal = ({ quiz, onClose }: QuizPreviewModalProps) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // The list rows may not carry the questions, so the full quiz is fetched when the preview opens
    useEffect(() => {
        if (!quiz) return;

        let cancelled = false;
        setQuestions([]);
        setError('');
        setLoading(true);
        superSalesAPI.getQuizById(quiz.id)
            .then((res) => {
                if (!cancelled) setQuestions(Array.isArray(res?.data?.data?.questions) ? res.data.data.questions : []);
            })
            .catch((err: any) => {
                if (!cancelled) setError(err?.response?.data?.message || err?.message || 'Failed to load the questions');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [quiz]);

    return (
        <PopupModal
            open={Boolean(quiz)}
            onClose={onClose}
            onSubmit={onClose}
            title={quiz ? `Preview: ${quiz.title}` : 'Preview'}
            subtitle=""
            hideButtons
            showFooter={false}
            contentHeight="auto"
            minHeight={300}
            maxHeight="calc(100vh - 200px)"
            className="quiz-preview-modal"
        >
            <Spin spinning={loading}>
                <div className="quiz-preview">
                    {error && <div className="quiz-preview__error">{error}</div>}
                    {!loading && !error && questions.length === 0 && (
                        <NoDataFound type="nodata" description="No questions in this quiz" style={{ height: 'unset' }} />
                    )}

                    {questions.map((question, index) => (
                        <div key={question.questionNumber ?? index} className="quiz-preview__question">
                            <div className="quiz-preview__question-head">
                                <span className="quiz-preview__number">Question {question.questionNumber ?? index + 1}</span>
                                {question.mark !== undefined && question.mark !== null && question.mark !== '' && (
                                    <span className="quiz-preview__mark">Mark: {String(question.mark)}</span>
                                )}
                            </div>
                            <div className="quiz-preview__text keep-case">{question.questionText}</div>
                            {question.questionImageUrl && <img className="quiz-preview__image" src={question.questionImageUrl} alt="Question" />}

                            <div className="quiz-preview__options">
                                {QUESTION_OPTION_KEYS.map((key, optionIndex) => {
                                    const text = question[key];
                                    const imageUrl = question[`${key}ImageUrl` as keyof QuizQuestion] as string | undefined;
                                    if (!text && !imageUrl) return null;

                                    const letter = OPTION_LETTERS[optionIndex];
                                    const isCorrect = String(question.correctOption || '').trim().toUpperCase() === letter;
                                    return (
                                        <div key={key} className={`quiz-preview__option${isCorrect ? ' quiz-preview__option--correct' : ''}`}>
                                            <span className="quiz-preview__letter">{letter}</span>
                                            <span className="quiz-preview__option-body keep-case">
                                                {text}
                                                {imageUrl && <img className="quiz-preview__image" src={imageUrl} alt={`Option ${letter}`} />}
                                            </span>
                                            {isCorrect && <span className="quiz-preview__correct-tag">Correct</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </Spin>
        </PopupModal>
    );
};

export default QuizPreviewModal;
