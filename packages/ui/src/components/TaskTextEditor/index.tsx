import { HocuspocusProvider } from "@hocuspocus/provider";
import { Box, Text } from "@mantine/core";
import { Link, RichTextEditor } from "@mantine/tiptap";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Highlight from "@tiptap/extension-highlight";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CenteredLoader from "@ui/components/CenteredLoader";
import { useAuth } from "@ui/hooks/useAuth";
import { useHocuspocusTaskProvider } from "@ui/hooks/useHocuspocusTaskProvider";
import { memo, Suspense, useCallback, useEffect, useMemo, useState } from "react";

interface TaskTextEditorProps {
	taskId: string | number;
}

const TaskTextEditor: React.FC<TaskTextEditorProps> = ({ taskId }) => {
	const websocketProvider = useHocuspocusTaskProvider();
	const { token, tokenData } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	const provider = useMemo(() => {
		return new HocuspocusProvider({
			websocketProvider,
			name: `document-${taskId}`,
			token,
			onStatus: ({ status }) => {
				setIsConnected(status === "connected");
			},
			onAuthenticationFailed: (data) => {
				setError(`Authentication failed: ${data.reason}`);
			},
			onDisconnect: () => {
				setError("Disconnected from server. Please check your internet connection.");
			},
			onConnect: () => {
				setError(null);
			},
		});
	}, [websocketProvider, taskId, token]);

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			Link,
			Superscript,
			SubScript,
			Highlight,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			Collaboration.configure({
				document: provider.document,
			}),
			CollaborationCursor.configure({
				provider: provider,
				user: {
					name: tokenData?.username ?? "Unknown User",
					color: "#6d408b",
				},
			}),
		],
	});

	useEffect(() => {
		return () => {
			if (provider.status === "connected") {
				provider.disconnect();
			}
		};
	}, [provider, token, tokenData]);

	const renderToolbar = useCallback(
		() => (
			<RichTextEditor.Toolbar sticky stickyOffset={60}>
				<RichTextEditor.ControlsGroup>
					<RichTextEditor.Bold />
					<RichTextEditor.Italic />
					<RichTextEditor.Underline />
					<RichTextEditor.Strikethrough />
					<RichTextEditor.ClearFormatting />
					<RichTextEditor.Highlight />
					<RichTextEditor.Code />
				</RichTextEditor.ControlsGroup>
				<RichTextEditor.ControlsGroup>
					<RichTextEditor.H1 />
					<RichTextEditor.H2 />
					<RichTextEditor.H3 />
					<RichTextEditor.H4 />
				</RichTextEditor.ControlsGroup>
				<RichTextEditor.ControlsGroup>
					<RichTextEditor.Blockquote />
					<RichTextEditor.Hr />
					<RichTextEditor.BulletList />
					<RichTextEditor.OrderedList />
					<RichTextEditor.Subscript />
					<RichTextEditor.Superscript />
				</RichTextEditor.ControlsGroup>
				<RichTextEditor.ControlsGroup>
					<RichTextEditor.Link />
					<RichTextEditor.Unlink />
				</RichTextEditor.ControlsGroup>
				<RichTextEditor.ControlsGroup>
					<RichTextEditor.AlignLeft />
					<RichTextEditor.AlignCenter />
					<RichTextEditor.AlignJustify />
					<RichTextEditor.AlignRight />
				</RichTextEditor.ControlsGroup>
				<RichTextEditor.ControlsGroup>
					<RichTextEditor.Undo />
					<RichTextEditor.Redo />
				</RichTextEditor.ControlsGroup>
			</RichTextEditor.Toolbar>
		),
		[],
	);

	if (error) {
		return (
			<Box>
				<Text c="red">Error: {error}</Text>
				<Text>Please refresh the page or contact support if the problem persists.</Text>
			</Box>
		);
	}

	if (!isConnected) {
		return <CenteredLoader />;
	}

	return (
		<Suspense fallback={<CenteredLoader />}>
			<RichTextEditor editor={editor}>
				{renderToolbar()}
				<RichTextEditor.Content />
			</RichTextEditor>
		</Suspense>
	);
};

export default memo(TaskTextEditor);
