import "./ClassSkillOverlay.css";

type ClassSkillOverlayProps = {
	onClickClose?: () => void;
};

const ClassSkillOverlay = ({ onClickClose }: ClassSkillOverlayProps) => {
	const handleClickClose = () => {
		onClickClose?.();
	};
	return (
		<div className="class-skill-overlay">

			{/* Gameplay Rules Section */}
			<div>
				<h3 style={{ fontWeight: "normal" }}>Gameplay Rules</h3>
				<p>
					- The player who runs out of HP or cards first loses the
					game.
					<br />
					- Damage is calculated based on Attack (ATK) and Defense
					(DEF).
					<br />- There is a chance to miss attacks, depending on the
					difference in Speed (SPD) between you and your opponent.
				</p>
			</div>

			<div className="class-skill-overlay__skill">
				<img
					className="Home__overlay__close"
					src="/icons/close.svg"
					onClick={handleClickClose}
				/>
				<div>
					<img src="/cards/WarriorCard.svg" />
					<h3 style={{ fontWeight: "normal" }}>Warrior's Blood</h3>
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
					<h3 style={{ fontWeight: "normal" }}>True Sight</h3>
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

					<h3 style={{ fontWeight: "normal" }}>True Strike</h3>
					<p>
						When winning with Scissors,
						<br />
						ignore the opponent’s defense.
						<br />
						(always hit)
					</p>
				</div>
			</div>
		</div>
	);
};

export default ClassSkillOverlay;
