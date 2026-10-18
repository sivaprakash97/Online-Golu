import SoftEnv from './SoftEnv.jsx'

// The lighting for renders of one Bommai on a hidden canvas: the option tiles (Thumbnails.jsx)
// and the photo booth (PhotoStudio.jsx) light their dolls the same way.
export default function StudioLights() {
  return (
    <>
      <hemisphereLight args={['#fff2dc', '#8a4a30', 1.1]} />
      <directionalLight position={[-2, 4, 4]} intensity={2.1} color="#ffe6c4" />
      <directionalLight position={[3, 1, 2]} intensity={0.5} />
      <SoftEnv intensity={0.25} />
    </>
  )
}
