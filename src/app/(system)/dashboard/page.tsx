import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <>
      <div className="app-page-title">
        <div className="page-title-wrapper">
          <div className="page-title-heading">
            <div className="page-title-icon">
              <i className="pe-7s-home icon-gradient bg-malibu-beach" />
            </div>

            <div>
              Dashboard
              <div className="page-title-subheading"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 col-xl-3">
          <div className="card mb-3 widget-content">
            <div className="widget-content-wrapper">
              <div className="widget-content-left">
                <div className="widget-heading">Total Audit</div>
                <div className="widget-subheading">All audit records</div>
              </div>
              <div className="widget-content-right">
                <div className="widget-numbers text-success">
                  <span>0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="card mb-3 widget-content">
            <div className="widget-content-wrapper">
              <div className="widget-content-left">
                <div className="widget-heading">Open Findings</div>
                <div className="widget-subheading">Need follow up</div>
              </div>
              <div className="widget-content-right">
                <div className="widget-numbers text-warning">
                  <span>0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="card mb-3 widget-content">
            <div className="widget-content-wrapper">
              <div className="widget-content-left">
                <div className="widget-heading">Closed Findings</div>
                <div className="widget-subheading">Completed actions</div>
              </div>
              <div className="widget-content-right">
                <div className="widget-numbers text-primary">
                  <span>0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="card mb-3 widget-content">
            <div className="widget-content-wrapper">
              <div className="widget-content-left">
                <div className="widget-heading">Users</div>
                <div className="widget-subheading">Registered users</div>
              </div>
              <div className="widget-content-right">
                <div className="widget-numbers text-danger">
                  <span>0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
