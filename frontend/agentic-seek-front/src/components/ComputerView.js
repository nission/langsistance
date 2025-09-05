import React, { memo, useMemo } from "react";
import BrowserView from "./BrowserView";
import "./ComputerView.css";

const ComputerView = memo(({
  currentView,
  setCurrentView,
  responseData,
  error,
  handleGetScreenshot,
  onError
}) => {
  // 使用 useMemo 来避免不必要的重新计算
  const blocksContent = useMemo(() => {
    if (!responseData?.blocks || Object.values(responseData.blocks).length === 0) {
      return (
        <div className="block">
          <p className="block-tool">Tool: No tool in use</p>
          <pre>No file opened</pre>
        </div>
      );
    }

    return Object.values(responseData.blocks).map((block, index) => (
      <div key={`${block.tool_type}-${index}`} className="block">
        <p className="block-tool">Tool: {block.tool_type}</p>
        <pre>{block.block}</pre>
        <p className="block-feedback">
          Feedback: {block.feedback}
        </p>
        {block.success ? (
          <p className="block-success">Success</p>
        ) : (
          <p className="block-failure">Failure</p>
        )}
      </div>
    ));
  }, [responseData?.blocks]);

  const handleViewChange = useMemo(() => ({
    toBlocks: () => setCurrentView("blocks"),
    toScreenshot: responseData?.screenshot
      ? () => setCurrentView("screenshot")
      : handleGetScreenshot
  }), [setCurrentView, responseData?.screenshot, handleGetScreenshot]);

  return (
    <div className="computer-section">
      <h2>Computer View</h2>
      <div className="view-selector">
        <button
          className={currentView === "blocks" ? "active" : ""}
          onClick={handleViewChange.toBlocks}
        >
          Editor View
        </button>
        <button
          className={currentView === "screenshot" ? "active" : ""}
          onClick={handleViewChange.toScreenshot}
        >
          Browser View
        </button>
      </div>
      <div className="content">
        {currentView === "blocks" ? (
          <div className="blocks">
            {blocksContent}
          </div>
        ) : (
          <BrowserView
            responseData={responseData}
            error={error}
            onError={onError}
          />
        )}
      </div>
    </div>
  );
});

ComputerView.displayName = 'ComputerView';

export default ComputerView;