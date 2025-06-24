import "./ClassSkillOverlay.css"

type ClassSkillOverlayProps = {
    onClickClose?: () => void;
}

const ClassSkillOverlay = ({onClickClose}:ClassSkillOverlayProps) => {

    const handleClickClose = () => {
        onClickClose?.();
    }
	return (
		<div className="class-skill-overlay">
			<img
				className="Home__overlay__close"
				src="/icons/close.svg"
				onClick={() => handleClickClose()}
			/>
			<div>
				<img src="/cards/WarriorCard.svg" />
				<h3>Warrior - Warrior's Blood</h3>
				<p>
					When drawing with Rock,
					<br />
					deal half of your damage.
					<br />
					(always hit)
				</p>
			</div>
			<div>
				<img src="/cards/MageCard.svg" />
				<h3>Mage - True Sight</h3>
				<p>
					When winning with Paper,
					<br />
					gain 1 True Sight token.
					<br />
					Use to reveal opponent's hand.
					<br />
				</p>
			</div>
			<div>
				<img src="/cards/AssassinCard.svg" />

				<h3>Assassin - True Strike</h3>
				<p>
					When winning with Scissors,
					<br />
					ignore the opponent’s defense.
					<br />
					(always hit)
				</p>
			</div>
		</div>
	);
};

export default ClassSkillOverlay;