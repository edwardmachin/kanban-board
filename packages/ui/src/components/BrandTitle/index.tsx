import { Title, TitleProps } from "@mantine/core";

const BrandTitle: React.FC<TitleProps> = ({ children, ...props }) => {
	return (
		<Title
			{...props}
			style={{
				...(props.style || {}),
				fontFamily: "SpaceAge, sans-serif",
				userSelect: "none",
			}}
		>
			{children}
		</Title>
	);
};

export default BrandTitle;
