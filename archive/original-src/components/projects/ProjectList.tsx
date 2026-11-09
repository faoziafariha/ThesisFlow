import { useState, useEffect } from 'react';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { Github, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';
import { db } from '../firebase'; // Ensure the correct path to your firebase configuration

type Project = {
  id: string;
  title: string;
  courseName: string;
  courseTeacher: string;
  teamMembers: string;
  githubLink: string;
  keywords: string;
  helpful: number;
  notHelpful: number;
};

interface ProjectListProps {
  selectedTeacher: string;
  selectedYear: string;
  selectedCourse: string;
}

export function ProjectList({ selectedTeacher, selectedYear, selectedCourse} : ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [clickedButtons, setClickedButtons] = useState<{ [key: string]: boolean }>({});
  
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        let q = collection(db, "Projects");
        let queryConstraints = [];

        if (selectedTeacher) {
          queryConstraints.push(where("courseTeacher", "==", selectedTeacher))
        }

        if (selectedYear){
          queryConstraints.push(where("publishingYear", "==", selectedYear))
        }

        if(selectedCourse){
          queryConstraints.push(where("courseName", "==", selectedCourse))
        }

        const finalQuery = query(q, ...queryConstraints);
        const querySnapshot = await getDocs(finalQuery);
        const projectsData: Project[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))  as Project[];
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [selectedTeacher, selectedCourse, selectedYear]);

  const handleHelpfulClick = async (projectId: string, currentHelpful: number) => {
    const projectDocRef = doc(db, "Projects", projectId);
    console.log(currentHelpful);
    if (currentHelpful === undefined || Number.isNaN(currentHelpful)) {
      currentHelpful = 0;
    }
  
    await updateDoc(projectDocRef, {
      helpful: currentHelpful + 1,
    });
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === projectId ? { ...project, helpful: (project.helpful ?? 0) + 1 } : project
      )
    );
    setClickedButtons((prev) => ({ ...prev, [projectId]: true }));
  };
  
  const handleNotHelpfulClick = async (projectId: string, currentNotHelpful: number) => {
    const projectDocRef = doc(db, "Projects", projectId);
    if (currentNotHelpful === undefined || Number.isNaN(currentNotHelpful)) {
      currentNotHelpful = 0;
    }
  
    await updateDoc(projectDocRef, {
      notHelpful: currentNotHelpful + 1,
    });
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === projectId ? { ...project, notHelpful: (project.notHelpful ?? 0) + 1 } : project
      )
    );
    setClickedButtons((prev) => ({ ...prev, [projectId]: true }));
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid absolute inset-0 m-auto"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {projects.map((project) => (
        <div key={project.id} className="projects bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Course:</span> {project.courseName}
            </p>
            <p className="students text-sm text-gray-600">
              <span className="font-medium">Students:</span> {project.teamMembers}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Course Teacher:</span> {project.courseTeacher}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
            <button
              onClick={() => handleHelpfulClick(project.id, project.helpful)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full hover:bg-emerald-200"
              disabled={clickedButtons[project.id]}
            >
              <ThumbsUp className="h-4 w-4" />
              {project.helpful}
            </button>
            <button
              onClick={() => handleNotHelpfulClick(project.id, project.notHelpful)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full hover:bg-red-200"
              disabled={clickedButtons[project.id]}
            >
              <ThumbsDown className="h-4 w-4" />
              {project.notHelpful}
            </button>
            </div>
            <div className="github flex gap-4">
              <a
                href={project.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
              >
                <Github className="h-4 w-4" />
                <span>View Code</span>
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}