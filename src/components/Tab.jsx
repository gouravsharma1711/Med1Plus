import { motion } from 'framer-motion';

export default function Tab({ tabData, field, setField, icon }) {
  return (
    <div className="flex flex-col items-center my-6">
      <div className="flex bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden w-full max-w-md">
        {tabData.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setField(tab.type)}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-all duration-200 ${
              field === tab.type
                ? "bg-blue-700 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            whileHover={{ y: field === tab.type ? 0 : -2 }}
            whileTap={{ y: 0 }}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab?.tabName}
          </motion.button>
        ))}
      </div>

      {/* Indicator line */}
      <div className="w-full max-w-md h-1 bg-gray-200 mt-1 rounded-full overflow-hidden">
        {tabData.map((tab, index) => (
          <motion.div
            key={tab.id}
            className="h-full bg-blue-700"
            initial={false}
            animate={{
              width: field === tab.type ? `${100 / tabData.length}%` : "0%",
              x: field === tab.type
                ? `${(100 / tabData.length) * tabData.findIndex(t => t.type === field)}%`
                : "0%"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        ))}
      </div>
    </div>
  );
}  