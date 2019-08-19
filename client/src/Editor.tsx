import React from 'react';
import { editor as MonacoEditor } from 'monaco-editor/esm/vs/editor/editor.api';
import createEditor from './common/editor';
import styles from './Editor.module.css';

interface Props {

}

class Editor extends React.Component<Props> {
  editor: MonacoEditor.IStandaloneCodeEditor = undefined!;
  editorRef = React.createRef<HTMLDivElement>();

  componentDidMount(): void {
    if (this.editorRef.current) {
      this.editor = createEditor(this.editorRef.current, `print('hello, world')`);
    }
  }

  componentWillUnmount(): void {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  render(): React.ReactNode {
    return (
      <div className={styles.container} ref={this.editorRef}></div>
    );
  }
}

export default Editor;
