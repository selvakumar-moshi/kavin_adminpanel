import React from 'react';

export interface InfoItemProps {
    icon: string;
    label: string;
    value: React.ReactNode;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => (
    <div className='user-detail__info-main'>
        <img src={icon} alt='' />
        <div className='user-detail__info-item'>
            <div className='user-detail__info-item-label'>{label}</div>
            <div className='user-detail__info-item-value'>{value}</div>
        </div>
    </div>
);

export default InfoItem;
