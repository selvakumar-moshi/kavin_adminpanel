import { Card, Row, Col, Spin, Empty, Avatar, Button } from 'antd';
import { UserOutlined, DownloadOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import { useDashboard } from './useDashboard';
import PageTitle from '../../components/PageTitle';
import DropdownField from '../../components/DropdownField/DropdownField';
import ToastMessages from '../../components/ToastMessages';
import { CATEGORY_COLORS } from './Constant';

const Dashboard = () => {
  const {
    loading,
    totalCourses,
    totalBatch,
    userCount,
    totalQuestion,
    totalStudyMaterial,
    totalVideoMaterial,
    quizzesArray,
    selectedQuizId,
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
    { type: 'Questions', value: totalQuestion },
  ];

  const quizOptions = quizzesArray.map((quiz) => ({ value: quiz.id, label: `${quiz.title} (${quiz.courseName})` }));

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
                  }}
                  legend={{
                    color: {
                      position: 'bottom',
                      layout: { justifyContent: 'center' },
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
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={handleDownloadRankList}
                loading={isDownloadingRankList}
                disabled={!selectedQuizId || rankList.length === 0}
              >
                Download
              </Button>
            }
          >
            <DropdownField
              fields={[
                {
                    name: 'quizId',
                    label: 'Quiz',
                    placeholder: 'Select a quiz to view its rank list',
                    options: quizOptions,
                },
              ]}
              values={{ quizId: selectedQuizId }}
              onChange={(_, value) => handleQuizChange(Array.isArray(value) ? value[0] || '' : value)}
            />

            <Spin spinning={rankListLoading}>
              {!selectedQuizId ? (
                <Empty description="Select a quiz to view its rank list" />
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
