import React from 'react';
import {useState, useEffect} from 'react';
import {getDocs, collection} from 'firebase/firestore';
import {db} from '../firebase';

interface ProjectFilterProps {
  setSelectedTeacher: (teacher: string) => void;
  setSelectedYear: (year: string) => void;
  setSelectedCourse: (course: string) => void;
}

export function ProjectFilters( {setSelectedTeacher, setSelectedYear, setSelectedCourse}: ProjectFilterProps) {
  const [teacherNames, setTeacherNames] = useState<string[]>([]);
  const [year, setYear] = useState<string[]>([]);
  const [course, setCourse] = useState<string[]>([]);

  const [selectedTeacher, setSelectedTeacherState] = useState<string>("");
  const [selectedYear, setSelectedYearState] = useState<string>("");
  const [selectedCourse, setSelectedCourseState] = useState<string>("");

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Projects'));
        const names = querySnapshot.docs.map((doc) => doc.data().courseTeacher);
        setTeacherNames([...new Set(names)].sort());
      } catch (error) {
        console.error('Error fetching teacher names:', error);
      }
    };

    fetchTeachers();
  }, []);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Projects'));
        const years = querySnapshot.docs.map((doc) => doc.data().publishingYear);
        setYear([...new Set(years)].sort());
      } catch (error) {
        console.error('Error fetching years:', error);
      }
    };

    fetchYears();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Projects'));
        const courses = querySnapshot.docs.map((doc) => doc.data().courseName);
        setCourse([...new Set(courses)].sort());
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, []);

  const handleSubmit = () => {
    setSelectedTeacher(selectedTeacher);
    setSelectedYear(selectedYear);
    setSelectedCourse(selectedCourse);
  }

  return (
    <div className="w-full md:w-64 bg-white p-6 rounded-lg shadow-md h-fit">
      <h2 className="font-semibold mb-4">Filters</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course
          </label>
          <select className="input" onChange={(e) => setSelectedCourseState(e.target.value)}>
            <option value="">All Courses</option>
            {course.map((course, index) => (
              <option key={index} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teacher
          </label>
          <select className="input" onChange={(e) => setSelectedTeacherState(e.target.value)}>
            <option value="">All Teachers</option>
            {teacherNames.map((teacher, index) => (
              <option key={index} value={teacher}>
                {teacher}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <select className="input" onChange={(e) => setSelectedYearState(e.target.value)}>
            <option value="">All years</option>
            {year.map((year, index) => (
              <option key={index} value={year}>
                {year}
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