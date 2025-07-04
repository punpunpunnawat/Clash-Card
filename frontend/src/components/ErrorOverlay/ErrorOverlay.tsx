import "./ErrorOverlay.css";

type ErrorOverlayProps = {
	message: string;
	onClose: () => void;
};

const ErrorOverlay = ({ message, onClose }: ErrorOverlayProps) => {
	return (
		<div className="overlay-backdrop" onClick={onClose}>
			<div className="overlay-box">
				<img src="/icons/close.svg" className="overlay-close"/>
				<h2 className="overlay-title">Something went wrong</h2>
				<span className="overlay-message">{message}</span>
			</div>
		</div>
	);
};

export default ErrorOverlay;
