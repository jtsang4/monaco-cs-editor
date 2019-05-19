import React from 'react';
import * as monaco from 'monaco-editor';
import styles from './Editor.module.css';

interface Props {

}

class Editor extends React.Component<Props> {
  editorRef = React.createRef<HTMLDivElement>();

  componentDidMount(): void {
    monaco.editor.create(this.editorRef.current as HTMLDivElement, {
      value: `print('hello, world')`,
      language: 'python',
    });
  }

  render(): React.ReactNode {
    return (
      <div className={styles.container} ref={this.editorRef}></div>
    );
  }
}

export default Editor;