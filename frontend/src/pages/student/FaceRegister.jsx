import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { Camera, CheckCircle, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, label: 'Position your face in the frame' },
  { id: 2, label: 'Make sure lighting is clear' },
  { id: 3, label: 'Click Capture & Register' },
]

export default function FaceRegister() {
  const webcamRef = useRef(null)
  const navigate = useNavigate()
  const { user, setFaceRegistered } = useAuthStore()

  const [captured, setCaptured] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (!imageSrc) {
      toast.error('Could not capture image. Check camera permissions.')
      return
    }
    setCaptured(imageSrc)
    setError(null)
  }, [])

  const retake = () => {
    setCaptured(null)
    setError(null)
  }

  const register = async () => {
    if (!captured) return
    setLoading(true)
    setError(null)
    try {
      await api.post('/api/student/register-face', {
        image_base64: captured,
        lecture_id: 0, // not used during registration
      })
      setSuccess(true)
      setFaceRegistered()
      toast.success('Face registered successfully!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center fade-up">
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-3">Face Registered!</h2>
        <p className="text-white/50 mb-8 max-w-sm">
          Your face has been successfully enrolled. You can now mark attendance using face recognition.
        </p>
        <button
          onClick={() => navigate('/student')}
          className="btn-primary flex items-center gap-2"
        >
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="fade-up">
        <h1 className="font-display text-3xl font-bold">Face Registration</h1>
        <p className="text-white/40 mt-1">
          {user?.is_face_registered
            ? 'Your face is already registered. Re-register below.'
            : 'First-time setup — register your face to enable attendance marking.'}
        </p>
      </div>

      {/* Steps */}
      <div className="flex gap-4 fade-up-delay-1">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex-1 card p-4 text-center">
            <div className="w-7 h-7 rounded-full bg-brand-600/30 text-brand-400 text-xs font-bold
                            flex items-center justify-center mx-auto mb-2 font-mono">
              {step.id}
            </div>
            <p className="text-xs text-white/50 leading-snug">{step.label}</p>
          </div>
        ))}
      </div>

      {/* Camera area */}
      <div className="card p-6 fade-up-delay-2">
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
          {!captured ? (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                onUserMedia={() => setCameraReady(true)}
                onUserMediaError={() => {
                  setError('Camera access denied. Please allow camera permissions.')
                  setCameraReady(false)
                }}
                className="w-full h-full object-cover"
              />
              {/* Face guide overlay */}
              {cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-48 h-56">
                    {/* Corners */}
                    {['top-0 left-0 border-t-2 border-l-2 rounded-tl-xl',
                      'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl',
                      'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl',
                      'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl'].map((cls, i) => (
                      <div key={i} className={`absolute w-8 h-8 border-brand-400 ${cls}`} />
                    ))}
                    {/* Pulse rings */}
                    <div className="absolute inset-0 rounded-full border border-brand-500/20 pulse-ring" />
                    <div className="absolute inset-4 rounded-full border border-brand-500/10 pulse-ring" style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>
              )}
              {!cameraReady && (
                <div className="flex flex-col items-center gap-3 text-white/40">
                  <Camera className="w-10 h-10" />
                  <p className="text-sm">Loading camera...</p>
                </div>
              )}
            </>
          ) : (
            <img src={captured} alt="Captured face" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          {!captured ? (
            <button
              onClick={capture}
              disabled={!cameraReady}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" />
              Capture Photo
            </button>
          ) : (
            <>
              <button onClick={retake} className="btn-secondary flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                onClick={register}
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {loading ? 'Registering...' : 'Register Face'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-5 fade-up-delay-3">
        <h3 className="font-semibold text-sm mb-3 text-white/60 uppercase tracking-wider">Tips for best results</h3>
        <ul className="space-y-2 text-sm text-white/50">
          {[
            'Face the camera directly with your face fully visible',
            'Use good, even lighting — avoid backlighting',
            'Remove sunglasses or anything covering your face',
            'Keep a neutral expression',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-brand-400 mt-0.5">→</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
