type PageBlockLoadingProps = {
  show: boolean;
};

export default function PageBlockLoading({ show }: PageBlockLoadingProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="page-block-loading">
      <div className="page-block-loading-content">
        <div className="page-loader-bars">
          <span className="page-loader-bar" />
          <span className="page-loader-bar" />
          <span className="page-loader-bar" />
        </div>
      </div>
    </div>
  );
}
