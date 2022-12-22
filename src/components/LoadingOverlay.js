import React from "react";

function LoadingOverlay({ loading }) {
	return (
		<div
			className={`fixed w-screen h-screen flex items-center justify-center justify-items-center bg-[#041938]/50 font-outfit font-light text-2xl tracking-wide text-white ${
				loading ? "opacity-100 z-30 " : "opacity-0 -z-10"
			} transition-all duration-300`}>
			Loading...
			<svg viewBox='0 0 100 100' className='animate-spin stroke-[15px] fill-transparent w-6 h-6 ml-3' xmlns='http://www.w3.org/2000/svg'>
				<circle cx='50' cy='50' r='40' strokeDasharray='100 50' className=' stroke-cyan-500' strokeLinecap='round' strokeLinejoin='round' />
			</svg>
		</div>
	);
}
export default LoadingOverlay;
