import React from 'react';

const ProjectBoundaryStatus = ({ hasProject, projectName }) => {
  return (
    <div className="boundary-status">
      <h3>Project Status</h3>
      {hasProject ? (
        <div className="status-card success">
          <div className="status-icon">✓</div>
          <div className="status-content">
            <h4>Project Boundary Detected</h4>
            {projectName && <p>Project: {projectName}</p>}
            <p>Ready to generate building envelope</p>
          </div>
        </div>
      ) : (
        <div className="status-card warning">
          <div className="status-icon">⚠</div>
          <div className="status-content">
            <h4>No Project Boundary</h4>
            <p>Please ensure you have a project with a defined boundary in Giraffe.</p>
            <p>The building envelope will be generated from the project boundary.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBoundaryStatus;