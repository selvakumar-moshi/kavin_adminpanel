import success_icon from "../../assets/success_icon.svg";
import nodata_icon from "../../assets/nodata_Icon.svg";
import { Empty } from "antd";

interface NoDataFoundProps {
  type?: 'pending' | 'nodata' | 'custom';
  description?: string;
  style?: React.CSSProperties;
}

const NoDataFound: React.FC<NoDataFoundProps> = ({ 
  type = 'pending',
  description,
  style,
}) => {

  return (
    <div className="no-data-found__container" style={style}>
      {type === 'pending' && (
        <>
        <img src={success_icon} alt="success_Icon" />
        <div className="no-data-found__pending-text">You're all caught up! <br />
          There are no pending requests to be reviewed.
        </div>
        </>
      )}
      {type === 'nodata' && (
        <Empty
          className="no-data-found__text"
          image={<img src={nodata_icon} alt="No data found" />}
          description={description}
        />
      )}
    </div>
  );
};


export default NoDataFound