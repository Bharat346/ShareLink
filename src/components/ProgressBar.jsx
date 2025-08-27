export const ProgressBar = ({ progress, total = 100}) => {
  const percentage = total ? Math.min((progress / total) * 100, 100) : 0;
  return (
    <div className="progress-bar-container">
      <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
      <span>{Math.floor(percentage)}%</span>
    </div>
  );
};