import React, { useState } from "react";
import {
  Box,
  Typography,
  Switch,
  Slider,
  FormControlLabel,
  FormGroup,
  Paper,
  Divider,
} from "@mui/material";
import { usePerformance } from "../contexts/PerformanceContext";

export const Settings = () => {
  const { 
    shouldUseAnimation, 
    setShouldUseAnimation, 
    animationComplexity, 
    setAnimationComplexity,
    devicePerformance,
    setDevicePerformance
  } = usePerformance();

  const handleAnimationToggle = (event) => {
    setShouldUseAnimation(event.target.checked);
  };

  const handleAnimationComplexityChange = (event, newValue) => {
    setAnimationComplexity(newValue);
  };

  const handleDevicePerformanceChange = (event, newValue) => {
    setDevicePerformance(newValue);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        动画设置
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={shouldUseAnimation}
              onChange={handleAnimationToggle}
              color="primary"
            />
          }
          label="启用动画效果"
        />
      </FormGroup>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          动画复杂度: {animationComplexity.toFixed(1)}
        </Typography>
        <Slider
          value={animationComplexity}
          onChange={handleAnimationComplexityChange}
          step={0.1}
          marks={[
            { value: 0, label: "低" },
            { value: 0.5, label: "中" },
            { value: 1, label: "高" },
          ]}
          min={0}
          max={1}
          disabled={!shouldUseAnimation}
        />
        <Typography variant="body2" color="text.secondary">
          调整动画的复杂程度。较低的值会减少动画效果以提高性能。
        </Typography>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          设备性能等级: {devicePerformance.toFixed(1)}
        </Typography>
        <Slider
          value={devicePerformance}
          onChange={handleDevicePerformanceChange}
          step={0.1}
          marks={[
            { value: 0, label: "低" },
            { value: 0.5, label: "中" },
            { value: 1, label: "高" },
          ]}
          min={0}
          max={1}
        />
        <Typography variant="body2" color="text.secondary">
          设置设备性能等级。较低的值会自动减少动画效果以提高性能。
        </Typography>
      </Box>
    </Paper>
  );
};