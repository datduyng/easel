
const FooterLayout: preact.FunctionComponent = ({
  children
}) => {
  return <div data-tauri-drag-region style={{
    // sticky footer
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white'
  }}>
    {children}
  </div>
}

FooterLayout.defaultProps = {
  __TYPE: "FooterLayout"
}

export default FooterLayout;