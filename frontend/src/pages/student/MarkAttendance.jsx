import { useRef, useState, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { ScanFace, CheckCircle, AlertCircle, RefreshCw, Clock, BookOpen } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function MarkAttendance() {
  const webcamRef = useRef(null)
  const [lectures, setLectures] = useState([])
  const [selectedLecture, setSelectedLecture] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)   // { success, message, similarity }
  const [cameraReady, setCameraReady] = useState(false)
  const [loadingLectures, setLoadingLectures] = useState(true)

  useEffect(() => { fetchOpenLectures() }, [])

  const fetchOpenLectures = async () => {
    setLoadingLectures(true)
    try {
      const { data } = await api.get('/api/student/lectures/open')
      setLectures(data)
    } catch {
      toast.error('Failed to load lectures')
    } finally {
      setLoadingLectures(false)
    }
  }

  const scanAndMark = useCallback(async () => {
    if (!selectedLecture || !webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) {
      toast.error('Could not capture image.')
      return
    }

    setScanning(true)
    setResult(null)
    try {
      const { data } = await api.post('/api/student/attendance/mark', {
        lecture_id: selectedLecture.id,
        image_base64: imageSrc,
      })
      setResult({ success: true, message: data.detail, similarity: data.similarity })
      toast.success('Attendance marked!')
      // Refresh lectures to update already_marked
      fetchOpenLectures()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Face verification failed. Please try again.'
      setResult({ success: false, message: msg })
    } finally {
      setScanning(false)
    }
  }, [selectedLecture])

  const noOpenLectures = !loadingLectures && lectures.length === 0

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="fade-up">
        <h1 className="font-display text-3xl font-bold">Mark Attendance</h1>
        <p className="text-white/40 mt-1">Select an open lecture and scan your face</p>
      </div>

      {/* Lecture selection */}
      <div className="card p-6 fade-up-delay-1">
        <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-400" />
          Open Lectures
        </h2>

        {loadingLectures ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : noOpenLectures ? (
          <div className="text-center py-10 text-white/30">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No lectures are currently open for attendance.</p>
            <button onClick={fetchOpenLectures} className="mt-4 btn-secondary text-sm flex items-center gap-2 mx-auto">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {lectures.map(lec => (
              <LectureCard
                key={lec.id}
                lecture={lec}
                selected={selectedLecture?.id === lec.id}
                onSelect={() => {
                  setSelectedLecture(lec)
                  setResult(null)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Camera + Scan */}
      {selectedLecture && !selectedLecture.already_marked && (
        <div className="card p-6 fade-up">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <ScanFace className="w-4 h-4 text-brand-400" />
            Face Scan
          </h2>

          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
              onUserMedia={() => setCameraReady(true)}
              onUserMediaError={() => toast.error('Camera access denied')}
              className="w-full h-full object-cover"
            />

            {/* Scan overlay */}
            {cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-56">
                  {[
                    'top-0 left-0 border-t-2 border-l-2 rounded-tl-xl',
                    'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl',
                    'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl',
                    'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl',
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-8 h-8 border-brand-400 ${cls} ${scanning ? 'border-emerald-400' : ''}`} />
                  ))}
                  {scanning && (
                    <>
                      <div className="absolute inset-0 rounded-full border border-emerald-500/30 pulse-ring" />
                      <div className="absolute inset-4 rounded-full border border-emerald-500/20 pulse-ring" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                </div>

                {/* Scanning label */}
                {scanning && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur
                                  px-4 py-2 rounded-full flex items-center gap-2 text-sm text-emerald-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Scanning...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Result banner */}
          {result && (
            <div className={`flex items-start gap-3 mt-4 p-4 rounded-xl text-sm border
              ${result.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-accent/10 border-accent/20 text-accent'}`}>
              {result.success
                ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold">{result.message}</p>
                {result.similarity != null && (
                  <p className="text-xs opacity-70 mt-0.5 font-mono">
                    Confidence: {(result.similarity * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={scanAndMark}
            disabled={scanning || !cameraReady || result?.success}
            className={`mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold
              transition-all duration-200
              ${result?.success
                ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                : 'btn-primary disabled:opacity-40 disabled:cursor-not-allowed'}`}
          >
            {scanning ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : result?.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <ScanFace className="w-4 h-4" />
            )}
            {scanning ? 'Scanning face...' : result?.success ? 'Attendance Recorded' : 'Scan & Mark Attendance'}
          </button>
        </div>
      )}

      {/* Already marked notice */}
      {selectedLecture?.already_marked && (
        <div className="card p-8 text-center fade-up">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg">Already Marked</h3>
          <p className="text-white/40 text-sm mt-1">
            Your attendance for <span className="text-white/70">{selectedLecture.subject_name}</span> has already been recorded.
          </p>
        </div>
      )}
    </div>
  )
}

function LectureCard({ lecture, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      disabled={lecture.already_marked}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200
        ${lecture.already_marked
          ? 'border-surface-border bg-white/2 opacity-60 cursor-default'
          : selected
            ? 'border-brand-500/60 bg-brand-600/10 shadow-glow'
            : 'border-surface-border hover:border-brand-500/40 hover:bg-white/3'}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{lecture.subject_name}</p>
          <p className="text-xs text-white/40 font-mono mt-0.5">{lecture.subject_code}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/50 flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
            {lecture.start_time} – {lecture.end_time}
          </p>
          <p className="text-xs text-white/30 mt-0.5">{lecture.date}</p>
          {lecture.already_marked && (
            <span className="badge-present mt-1 inline-flex">
              <CheckCircle className="w-3 h-3" /> Done
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
