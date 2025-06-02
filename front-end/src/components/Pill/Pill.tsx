import "./Pill.css";

type PillProps = {
	label: string;
    type?: "Default"|"Rock"|"Paper"|"Scissors"
};

const Pill = ({ label, type = "Default" }: PillProps) => {
	return (
		<div className="Pill" style={{ background: "var(--color-"+type+")" }}>
			{label}
		</div>
	);
};
export default Pill;
