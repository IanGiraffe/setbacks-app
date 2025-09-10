import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

const ProjectBoundaryStatus = ({ hasProject }) => {
  // Only show when there's no project boundary
  if (hasProject) {
    return null;
  }

  return (
    <motion.div 
      className="mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-yellow-700 font-medium">
        Boundary not detected. Please ensure you have a project with a defined boundary in Giraffe.
      </p>
    </motion.div>
  );
};

export default ProjectBoundaryStatus;