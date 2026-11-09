import React, { useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { useEffect } from "react";
import { db } from "../firebase";

interface ThesisFiltersProps {
  setSelectedSupervisor: (supervisor: string) => void;
  setSelectedYear: (year: string) => void;
  setSelectedTopic: (topic: string) => void;
}

export function ThesisFilters({ setSelectedSupervisor, setSelectedYear, setSelectedTopic }: ThesisFiltersProps) {
  const [supervisorNames, setSupervisorNames] = useState<string[]>([]);
  const [year, setYear] = useState<string[]>([]);
  const [topic, setTopic] = useState<string[]>([]);

  const [selectedSupervisor, setSelectedSupervisorState] = useState<string>("");
  const [selectedYear, setSelectedYearState] = useState<string>("");
  const [selectedTopic, setSelectedTopicState] = useState<string>("");

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Thesis Paper"));
        const names = querySnapshot.docs.map((doc) => doc.data().supervisor); // Extracting only names
        setSupervisorNames([...new Set(names)].sort());
      } catch (error) {
        console.error("Error fetching supervisor names:", error);
      }
    };

    fetchSupervisors();
  }, []);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Thesis Paper"));
        const years = querySnapshot.docs.map((doc) => doc.data().publishingYear); // Extracting only years
        console.log(years);
        setYear([...new Set(years)].sort());
      } catch (error) {
        console.error("Error fetching years:", error);
      }
    };

    fetchYears();
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Thesis Paper"));
        const topics = querySnapshot.docs.map((doc) => doc.data().topic); // Extracting only topics
        console.log(topics);
        setTopic([...new Set(topics)].sort());
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };

    fetchTopics();
  }, []);

  const handleSubmit = () => {
    setSelectedSupervisor(selectedSupervisor);
    setSelectedYear(selectedYear);
    setSelectedTopic(selectedTopic);
  };

  return (
    <div className="w-full md:w-64 bg-white p-6 rounded-lg shadow-md h-fit">
      <h2 className="font-semibold mb-4">Filters</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <select className="input" onChange={(e) => setSelectedYearState(e.target.value)}>
            <option value="">All Years</option>
            {year.map((year, index) => (
              <option key={index} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supervisor
          </label>
          <select className="input" onChange={(e) => setSelectedSupervisorState(e.target.value)}>
            <option value="">All Supervisors</option>
            {supervisorNames.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic
          </label>
          <select className="input" onChange={(e) => setSelectedTopicState(e.target.value)}>
            <option value="">All Topics</option>
            {topic.map((topic, index) => (
              <option key={index} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}