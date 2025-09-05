import React, { useState, useCallback } from "react";
import "./BrowserView.css";

const BrowserView = ({
  responseData,
  error,
  onError
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback((e) => {
    e.target.src = "placeholder.png";
    setImageError(true);
    setImageLoaded(false);
    console.error("Failed to load screenshot");
    if (onError) {
      onError("Failed to load screenshot");
    }
  }, [onError]);

  return (
    <div className="browser-view">
      {error && <p className="error">{error}</p>}
      <div className="screenshot">
        {!imageLoaded && !imageError && (
          <div className="screenshot-loading">
            <div className="loading-spinner"></div>
            <p>加载截图中...</p>
          </div>
        )}
        <img
          src={responseData?.screenshot || "placeholder.png"}
          alt="Browser Screenshot"
          onLoad={handleImageLoad}
          onError={handleImageError}
          key={responseData?.screenshotTimestamp || "default"}
          className={`screenshot-image ${imageLoaded ? 'loaded' : 'loading'}`}
          style={{
            display: imageLoaded || imageError ? 'block' : 'none'
          }}
        />
      </div>
    </div>
  );
};

export default BrowserView;