import { Tool } from '@/app/types/tool';

interface ToolTableProps {
  tools: Tool[];
  onEdit: (tool: Tool) => void;
  onDelete: (tool: Tool) => void;
}

const ToolTable = ({ tools, onEdit, onDelete }: ToolTableProps) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full leading-normal">
        <thead>
          <tr>
            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Name
            </th>
            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Description
            </th>
            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Public
            </th>
            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tools.map((tool) => (
            <tr key={tool._id} className="hover:bg-gray-50">
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p className="text-gray-900 whitespace-no-wrap">{tool.name}</p>
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p className="text-gray-900 whitespace-no-wrap">{tool.description}</p>
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                    tool.isPublic ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                  <span aria-hidden className={`absolute inset-0 ${
                      tool.isPublic ? 'bg-green-200' : 'bg-yellow-200'
                    } opacity-50 rounded-full`}></span>
                  <span className="relative">{tool.isPublic ? 'Yes' : 'No'}</span>
                </span>
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <button onClick={() => onEdit(tool)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                <button onClick={() => onDelete(tool)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ToolTable;
 