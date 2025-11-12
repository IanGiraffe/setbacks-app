import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { cn } from '../utils/cn';
import { VALIDATION_STATUS } from '../constants/validationRules';

const ValidationPanel = ({ validationResults, isLoading = false }) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border-2 border-slate-300 rounded-md p-4"
      >
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <motion.div
            className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span className="text-sm font-medium">Validating design...</span>
        </div>
      </motion.div>
    );
  }

  if (!validationResults || !validationResults.results) {
    return null;
  }

  const { isCompliant, hasBreaches, breachCount, results } = validationResults;

  // Status styling
  const statusColors = {
    compliant: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-800',
      icon: '✓'
    },
    breach: {
      bg: 'bg-red-50',
      border: 'border-red-600',
      text: 'text-red-800',
      icon: '✗'
    },
    unknown: {
      bg: 'bg-slate-50',
      border: 'border-slate-400',
      text: 'text-slate-600',
      icon: '?'
    }
  };

  const overallStyle = hasBreaches
    ? statusColors.breach
    : isCompliant
      ? statusColors.compliant
      : statusColors.unknown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-md border-2 p-4",
        overallStyle.bg,
        overallStyle.border
      )}
    >
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-2xl", overallStyle.text)}>
            {overallStyle.icon}
          </span>
          <h3 className={cn("text-lg font-black", overallStyle.text)}>
            {isCompliant
              ? 'Design Compliant'
              : hasBreaches
                ? `Design Non-Compliant (${breachCount} ${breachCount === 1 ? 'breach' : 'breaches'})`
                : 'Validation Incomplete'
            }
          </h3>
        </div>
        <p className={cn("text-xs font-medium", overallStyle.text)}>
          {isCompliant
            ? 'All parameters meet zoning requirements'
            : hasBreaches
              ? 'The following parameters exceed zoning limits:'
              : 'Some validation data unavailable'
          }
        </p>
      </div>

      {/* Validation Results */}
      <div className="space-y-2">
        <AnimatePresence>
          {Object.entries(results).map(([key, result], index) => {
            const resultStyle = result.status === VALIDATION_STATUS.BREACH
              ? statusColors.breach
              : result.status === VALIDATION_STATUS.COMPLIANT
                ? statusColors.compliant
                : statusColors.unknown;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  "p-2 rounded border",
                  result.status === VALIDATION_STATUS.BREACH
                    ? "bg-red-100 border-red-400"
                    : result.status === VALIDATION_STATUS.COMPLIANT
                      ? "bg-green-50 border-green-300"
                      : "bg-slate-50 border-slate-300"
                )}
              >
                <div className="flex items-start gap-2">
                  <span className={cn("text-sm font-bold", resultStyle.text)}>
                    {resultStyle.icon}
                  </span>
                  <div className="flex-1">
                    <p className={cn(
                      "text-xs font-medium leading-tight",
                      result.status === VALIDATION_STATUS.BREACH
                        ? "text-red-900"
                        : result.status === VALIDATION_STATUS.COMPLIANT
                          ? "text-green-900"
                          : "text-slate-700"
                    )}>
                      {result.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Help Text for Breaches */}
      {hasBreaches && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 p-2 bg-red-100 border border-red-400 rounded text-xs text-red-900"
        >
          <strong>Action Required:</strong> Modify your design to comply with zoning parameters
          or update the envelope parameters to match your design intent.
        </motion.div>
      )}

      {/* Debug: Show Provided Values */}
      {validationResults.providedValues && (
        <motion.details
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-3 text-xs"
        >
          <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900 mb-1">
            📊 Analytics Data (Debug)
          </summary>
          <div className="mt-2 p-2 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">
            <div className="space-y-1">
              <div><strong>Max Height (ft):</strong> {validationResults.providedValues.maxHeightFt ?? 'null'}</div>
              <div><strong>Min Height (ft):</strong> {validationResults.providedValues.minHeightFt ?? 'null'}</div>
              <div><strong>Max Height (stories):</strong> {validationResults.providedValues.maxHeightStories ?? 'null'}</div>
              <div><strong>Min Height (stories):</strong> {validationResults.providedValues.minHeightStories ?? 'null'}</div>
              <div><strong>FAR:</strong> {validationResults.providedValues.far ?? 'null'}</div>
              <div><strong>Density:</strong> {validationResults.providedValues.density ?? 'null'}</div>
              <div><strong>Impervious Cover %:</strong> {validationResults.providedValues.imperviousCover ?? 'null'}</div>
            </div>
          </div>
        </motion.details>
      )}
    </motion.div>
  );
};

export default ValidationPanel;
