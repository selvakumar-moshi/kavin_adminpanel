import { Card, Row, Col, Spin, Empty, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import { useDashboard } from './useDashboard';
import PageTitle from '../../components/PageTitle';
import DropdownField from '../../components/DropdownField/DropdownField';
import ToastMessages from '../../components/ToastMessages';
import { CATEGORY_COLORS, RANK_QUIZ_TYPE_OPTIONS, RANK_QUIZ_TO_VIEW_OPTIONS } from './Constant';
import download_Icon from '../../assets/pngDownload.svg';

// The chart is drawn on a canvas, which can't resolve `var(--font-family)` — so read the variable's actual value
const CHART_FONT_FAMILY =
  (typeof document !== 'undefined'
    && getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim());

const Dashboard = () => {
  const {
    loading,
    totalCourses,
    totalBatch,
    userCount,
    // totalQuestion,
    totalQuiz,
    totalStudyMaterial,
    totalVideoMaterial,
    quizType,
    quizToView,
    showQuizToView,
    quizOptions,
    quizzesLoading,
    selectedQuizId,
    handleQuizTypeChange,
    handleQuizToViewChange,
    handleQuizChange,
    rankList,
    rankListLoading,
    handleDownloadRankList,
    isDownloadingRankList,
    toastMessages,
    hideToast,
  } = useDashboard();

  const overviewData = [
    { type: 'Courses', value: totalCourses },
    { type: 'Batches', value: totalBatch },
    { type: 'Users', value: userCount },
    { type: 'Study Materials', value: totalStudyMaterial },
    { type: 'Video Materials', value: totalVideoMaterial },
    // { type: 'Questions', value: totalQuestion },
    { type: 'Quiz', value: totalQuiz },
  ];

  return (
    <div>
      <ToastMessages messages={toastMessages} onMessageClose={hideToast} />
      <PageTitle title="Dashboard" />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Tab Names, Financial Years & Users" style={{ height: '100%' }}>
            <Spin spinning={loading}>
              {overviewData.every((d) => d.value === 0) ? (
                <Empty description="No data available" />
              ) : (
                <Pie
                  data={overviewData}
                  angleField="value"
                  colorField="type"
                  color={CATEGORY_COLORS}
                  radius={0.8}
                  label={{
                    text: (d: { type: string; value: number }) => `${d.type}\n${d.value}`,
                    position: 'outside',
                    fontFamily: CHART_FONT_FAMILY,
                  }}
                  legend={{
                    color: {
                      position: 'bottom',
                      layout: { justifyContent: 'center' },
                      itemLabelFontFamily: CHART_FONT_FAMILY,
                    },
                  }}
                  height={320}
                />
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title="Quiz Rank List"
            style={{ height: '100%' }}
            extra={
              <div className={`quiz-rank-list__download${!selectedQuizId || rankList.length === 0 || isDownloadingRankList ? ' quiz-rank-list__download--disabled' : ''}`}
                onClick={() => {
                  if (!selectedQuizId || rankList.length === 0 || isDownloadingRankList) return;
                  handleDownloadRankList();
                }}
              >
                {isDownloadingRankList ? (
                  <Spin size="small" />
                ) : (
                  <img src={download_Icon} alt="Download" />
                )}
                Download
              </div>
            }
          >
            {/* Quiz Type, then (Competitive only) Quiz To View, then the quizzes that match */}
            <DropdownField
              fields={[
                {
                    name: 'quizType',
                    label: 'Quiz Type',
                    placeholder: 'Select quiz type',
                    options: RANK_QUIZ_TYPE_OPTIONS,
                    allowClear: false,
                },
              ]}
              values={{ quizType }}
              onChange={(_, value) => handleQuizTypeChange(Array.isArray(value) ? value[0] || '' : value)}
            />

            {showQuizToView && (
              <DropdownField
                fields={[
                  {
                      name: 'quizToView',
                      label: 'Quiz To View',
                      placeholder: 'Select Free or Paid',
                      options: RANK_QUIZ_TO_VIEW_OPTIONS,
                      allowClear: false,
                  },
                ]}
                values={{ quizToView }}
                onChange={(_, value) => handleQuizToViewChange(Array.isArray(value) ? value[0] || '' : value)}
              />
            )}

            <DropdownField
              fields={[
                {
                    name: 'quizId',
                    label: 'Quiz',
                    placeholder: 'Select a quiz to view its rank list',
                    options: quizOptions,
                    loading: quizzesLoading,
                },
              ]}
              values={{ quizId: selectedQuizId }}
              onChange={(_, value) => handleQuizChange(Array.isArray(value) ? value[0] || '' : value)}
            />

            <Spin spinning={rankListLoading}>
              {!selectedQuizId ? (
                <Empty description={quizzesLoading ? 'Loading quizzes...' : quizOptions.length === 0 ? 'No quiz found for this selection' : 'Select a quiz to view its rank list'} />
              ) : rankList.length === 0 ? (
                <Empty description="No submissions yet for this quiz" />
              ) : (
                <div className="quiz-rank-list">
                  {rankList.map((entry) => (
                    <div className="quiz-rank-list__item" key={entry.userId}>
                      <span className="quiz-rank-list__rank">{entry.rank}</span>
                      <Avatar
                        size={32}
                        src={entry.profileImage || undefined}
                        icon={!entry.profileImage ? <UserOutlined /> : undefined}
                      />
                      <span className="quiz-rank-list__name">{entry.firstName} {entry.lastName}</span>
                      <span className="quiz-rank-list__score">{entry.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
