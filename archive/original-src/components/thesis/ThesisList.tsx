import { useState, useEffect } from "react";
import { collection, doc, getDocs, updateDoc, query, where } from "firebase/firestore";
import { FileText, Download, Award, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { db } from "../../components/firebase"; // Ensure correct path to firebase.tsx

type Thesis = {
  id: string;
  title: string;
  author: string;
  supervisor: string;
  publishingYear: number;
  topic: string;
  keywords: string;
  helpful: number;
  notHelpful: number;
  publicationName: string | null;
  publicationDoi: string | null;
  publicationUrl: string | null;
  publicationCitation: number | null;
  pdfLink: string;
};

type Publication = {
  publicationName: string | null;
  publicationDoi: string | null;
  publicationUrl: string | null;
  publicationCitation: number | null;
};

interface ThesisListProps {
  selectedSupervisor: string;
  selectedYear: string;
  selectedTopic: string;
}

export function ThesisList({ selectedSupervisor, selectedYear, selectedTopic }: ThesisListProps) {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [clickedButtons, setClickedButtons] = useState<{ [key: string]: boolean }>({});

  // Fetch theses from Firestore
  useEffect(() => {
    const fetchTheses = async () => {
      setLoading(true);
      try {
        const q = collection(db, "Thesis Paper");
        const queryConstraints = [];

        if (selectedSupervisor) {
          console.log(selectedSupervisor)
          queryConstraints.push(where("supervisor", "==", selectedSupervisor));
        }
        if (selectedYear) {
          queryConstraints.push(where("publishingYear", "==", selectedYear));
        }
        if (selectedTopic) {
          console.log(selectedTopic)
          queryConstraints.push(where("topic", "==", selectedTopic));
        }

        const finalQuery = query(q, ...queryConstraints);
        console.log(finalQuery);
        const querySnapshot = await getDocs(finalQuery);
        const thesesData: Thesis[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Thesis[];
        setTheses(thesesData);
      } catch (error) {
        console.error("Error fetching theses: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTheses();
  }, [selectedSupervisor, selectedTopic, selectedYear]);

  const handleHelpfulClick = async (thesisId: string, currentHelpful: number) => {
    const thesisDocRef = doc(db, "Thesis Paper", thesisId);
    console.log(currentHelpful);
    if (currentHelpful === undefined || Number.isNaN(currentHelpful)) {
      currentHelpful = 0;
    }
  
    await updateDoc(thesisDocRef, {
      helpful: currentHelpful + 1,
    });
    setTheses((prevTheses) =>
      prevTheses.map((thesis) =>
        thesis.id === thesisId ? { ...thesis, helpful: (thesis.helpful ?? 0) + 1 } : thesis
      )
    );
    setClickedButtons((prev) => ({ ...prev, [thesisId]: true }));
  };

  const handleNotHelpfulClick = async (thesisId: string, currentNotHelpful: number) => {
    const thesisDocRef = doc(db, "Thesis Paper", thesisId);
    if (currentNotHelpful === undefined || Number.isNaN(currentNotHelpful)) {
      currentNotHelpful = 0;
    }
  
    await updateDoc(thesisDocRef, {
      notHelpful: currentNotHelpful + 1,
    });
    setTheses((prevTheses) =>
      prevTheses.map((thesis) =>
        thesis.id === thesisId ? { ...thesis, notHelpful: (thesis.notHelpful ?? 0) + 1 } : thesis
      )
    );
    setClickedButtons((prev) => ({ ...prev, [thesisId]: true }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <p>Loading...</p>
      ) : (
        theses.map((thesis) => (
          <div key={thesis.id} className="theses bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{thesis.title}</h3>
                <p className="thesis-author mt-1 text-sm text-gray-600">By {thesis.author}</p>
                <p className="mt-1 text-sm text-gray-600">Supervisor: {thesis.supervisor}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Year: {thesis.publishingYear} | Topic: {thesis.topic}
                </p>
                <p className="mt-1 text-sm text-gray-600">By {thesis.author}</p>
                <p className="mt-1 text-sm text-gray-600">Supervisor: {thesis.supervisor}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Year: {thesis.publishingYear} | Topic: {thesis.topic}
                </p>
                <p className="mt-1 text-sm text-gray-600">Keywords: {thesis.keywords}</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full hover:bg-emerald-200"
                      onClick={() => handleHelpfulClick(thesis.id, thesis.helpful)}
                      disabled={clickedButtons[thesis.id]}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {thesis.helpful}
                    </button>
                    <button
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full hover:bg-red-200"
                      onClick={() => handleNotHelpfulClick(thesis.id, thesis.notHelpful)}
                      disabled={clickedButtons[thesis.id]}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      {thesis.notHelpful}
                    </button>
                  </div>
                  {thesis.publicationName && (
                    <button
                      onClick={() =>
                        setSelectedPublication({
                          publicationName: thesis.publicationName,
                          publicationDoi: thesis.publicationDoi,
                          publicationUrl: thesis.publicationUrl,
                          publicationCitation: thesis.publicationCitation,
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full hover:bg-blue-200"
                    >
                      <Award className="h-4 w-4" />
                      Published in Journal/Conference
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="thesis-view btn btn-secondary flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <a href={thesis.pdfLink} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </button>
                <button className="download btn btn-primary flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <a href={thesis.pdfLink} target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Publication Modal */}
      {selectedPublication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Publication Details</h3>
              <button
                onClick={() => setSelectedPublication(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <p>
                <span className="font-medium">Published in:</span>{" "}
                {selectedPublication.publicationName || "Not Available"}
              </p>
              <p>
                <span className="font-medium">DOI:</span> {selectedPublication.publicationDoi || "Not Available"}
              </p>
              <p>
                <span className="font-medium">Citations:</span>{" "}
                {selectedPublication.publicationCitation ?? "Not Available"}
              </p>
              <a
                href={selectedPublication.publicationUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 block"
              >
                View Publication
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
