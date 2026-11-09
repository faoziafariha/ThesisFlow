import { Search } from 'lucide-react';
import { ThesisList } from '../components/thesis/ThesisList';
import { ThesisFilters } from '../components/thesis/ThesisFilters';
import {useState} from 'react';

export function ThesisPapers() {

  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  const supervisorSelect = (supervisor: string) => {
    setSelectedSupervisor(supervisor);
  }
  const yearSelect = (year: string) => {
    setSelectedYear(year);
  }
  const topicSelect = (topic: string) => {
    setSelectedTopic(topic);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Thesis Papers</h1>
        <p className="mt-2 text-gray-600">Browse and search through all thesis papers</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <ThesisFilters 
          setSelectedSupervisor={supervisorSelect} 
          setSelectedYear={yearSelect} 
          setSelectedTopic={topicSelect} 
        />
        <div className="flex-1">
          
          <ThesisList selectedSupervisor={selectedSupervisor} selectedYear={selectedYear} selectedTopic={selectedTopic} />
        </div>
      </div>
    </div>
  );
}