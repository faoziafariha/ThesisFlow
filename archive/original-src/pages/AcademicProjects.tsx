import { ProjectList } from '../components/projects/ProjectList';
import { ProjectFilters } from '../components/projects/ProjectFilters';
import { useState } from 'react';


export function AcademicProjects() {

  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  const teacherSelect = (teacher: string) => {
    setSelectedTeacher(teacher);
  }
  const yearSelect = (year: string) => {
    setSelectedYear(year);
  }
  const courseSelect = (course: string) => {
    setSelectedCourse(course);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Academic Projects</h1>
        <p className="mt-2 text-gray-600">Browse through student course projects</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <ProjectFilters 
          setSelectedTeacher={teacherSelect}
          setSelectedYear={yearSelect}
          setSelectedCourse={courseSelect}
        />
        <ProjectList 
          selectedTeacher = {selectedTeacher}
          selectedYear = {selectedYear}
          selectedCourse = {selectedCourse}
        />
      </div>
    </div>
  );
}